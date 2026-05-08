using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjetoFinalBackend.Models;
using System.Security.Claims;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EncomendasController : ControllerBase
    {
        private readonly string _connectionString;

        public EncomendasController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        // POST api/encomendas — cria uma nova encomenda
        [HttpPost]
        public IActionResult CriarEncomenda([FromBody] EncomendaModel model)
        {
            if (model.Items == null || model.Items.Count == 0)
                return BadRequest("A encomenda não tem itens.");

            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            // Obter id do utilizador
            int utilizadorId;
            using (SqlCommand cmd = new SqlCommand("SELECT id_utilizadores FROM utilizadores WHERE email=@Email", conn))
            {
                cmd.Parameters.AddWithValue("@Email", email);
                var result = cmd.ExecuteScalar();
                if (result == null) return NotFound("Utilizador não encontrado.");
                utilizadorId = (int)result;
            }

            // Usar uma transação para garantir consistência
            using SqlTransaction transaction = conn.BeginTransaction();
            try
            {
                decimal total = 0;
                var itensSanitizados = new List<(int produtoId, string nomeProduto, decimal precoUnitario, int quantidade)>();

                // Validar stock e calcular total para cada item
                foreach (var item in model.Items)
                {
                    string queryProduto = "SELECT nome, preco, stock FROM produtos WHERE id_produtos=@Id";
                    using SqlCommand cmdProduto = new SqlCommand(queryProduto, conn, transaction);
                    cmdProduto.Parameters.AddWithValue("@Id", item.ProdutoId);
                    using SqlDataReader reader = cmdProduto.ExecuteReader();

                    if (!reader.Read())
                    {
                        transaction.Rollback();
                        return BadRequest($"Produto com id {item.ProdutoId} não existe.");
                    }

                    string nomeProduto = reader["nome"].ToString();
                    decimal preco = (decimal)reader["preco"];
                    int stockAtual = (int)reader["stock"];
                    reader.Close();

                    if (item.Quantidade <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest($"Quantidade inválida para \"{nomeProduto}\".");
                    }

                    if (stockAtual < item.Quantidade)
                    {
                        transaction.Rollback();
                        return BadRequest($"Stock insuficiente para \"{nomeProduto}\" (disponível: {stockAtual}).");
                    }

                    total += preco * item.Quantidade;
                    itensSanitizados.Add((item.ProdutoId, nomeProduto, preco, item.Quantidade));
                }

                // Garantir que o código postal existe em codigos_postais antes de inserir a encomenda
                if (!string.IsNullOrWhiteSpace(model.CodigoPostal))
                {
                    string cidade = string.IsNullOrWhiteSpace(model.Cidade) ? "Desconhecido" : model.Cidade.Trim();
                    using SqlCommand cmdCP = new SqlCommand(@"
                        IF NOT EXISTS (SELECT 1 FROM codigos_postais WHERE codigo_postal = @CP)
                            INSERT INTO codigos_postais (codigo_postal, localidade, distrito, cidade)
                            VALUES (@CP, @Cidade, @Cidade, @Cidade)", conn, transaction);
                    cmdCP.Parameters.AddWithValue("@CP", model.CodigoPostal.Trim());
                    cmdCP.Parameters.AddWithValue("@Cidade", cidade);
                    cmdCP.ExecuteNonQuery();
                }

                // Inserir a encomenda
                string insertEncomenda = @"
                    INSERT INTO encomendas (id_utilizadores, total, morada_entrega, codigo_postal, notas)
                    OUTPUT INSERTED.id_encomendas
                    VALUES (@UtilizadorId, @Total, @Morada, @CodigoPostal, @Notas)";

                int encomendaId;
                using (SqlCommand cmd = new SqlCommand(insertEncomenda, conn, transaction))
                {
                    cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);
                    cmd.Parameters.AddWithValue("@Total", total);
                    cmd.Parameters.AddWithValue("@Morada", string.IsNullOrEmpty(model.MoradaEntrega) ? DBNull.Value : (object)model.MoradaEntrega);
                    cmd.Parameters.AddWithValue("@CodigoPostal", string.IsNullOrEmpty(model.CodigoPostal) ? DBNull.Value : (object)model.CodigoPostal);
                    cmd.Parameters.AddWithValue("@Notas", string.IsNullOrEmpty(model.Notas) ? DBNull.Value : (object)model.Notas);
                    encomendaId = (int)cmd.ExecuteScalar();
                }

                // Inserir itens e decrementar stock
                // preco_unitario guardado no momento da compra para preservar o histórico correto
                foreach (var (produtoId, nomeProduto, precoUnitario, quantidade) in itensSanitizados)
                {
                    string insertItem = @"
                        INSERT INTO encomenda_items (id_encomendas, id_produtos, quantidade, preco_unitario)
                        VALUES (@EncomendaId, @ProdutoId, @Quantidade, @PrecoUnitario)";
                    using (SqlCommand cmd = new SqlCommand(insertItem, conn, transaction))
                    {
                        cmd.Parameters.AddWithValue("@EncomendaId", encomendaId);
                        cmd.Parameters.AddWithValue("@ProdutoId", produtoId);
                        cmd.Parameters.AddWithValue("@Quantidade", quantidade);
                        cmd.Parameters.AddWithValue("@PrecoUnitario", precoUnitario);
                        cmd.ExecuteNonQuery();
                    }

                    string decrementarStock = "UPDATE produtos SET stock = stock - @Quantidade WHERE id_produtos = @Id";
                    using (SqlCommand cmd = new SqlCommand(decrementarStock, conn, transaction))
                    {
                        cmd.Parameters.AddWithValue("@Quantidade", quantidade);
                        cmd.Parameters.AddWithValue("@Id", produtoId);
                        cmd.ExecuteNonQuery();
                    }
                }

                transaction.Commit();
                return Ok(new { id = encomendaId, total });
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // GET api/encomendas — lista as encomendas do utilizador autenticado
        [HttpGet]
        public IActionResult GetEncomendas()
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            int utilizadorId;
            using (SqlCommand cmd = new SqlCommand("SELECT id_utilizadores FROM utilizadores WHERE email=@Email", conn))
            {
                cmd.Parameters.AddWithValue("@Email", email);
                var result = cmd.ExecuteScalar();
                if (result == null) return NotFound();
                utilizadorId = (int)result;
            }

            string queryEncomendas = @"
                SELECT e.id_encomendas, e.data_criacao, e.estado, e.total,
                       e.morada_entrega, e.codigo_postal, e.notas, cp.cidade
                FROM encomendas e
                LEFT JOIN codigos_postais cp ON e.codigo_postal = cp.codigo_postal
                WHERE e.id_utilizadores = @UtilizadorId
                ORDER BY e.data_criacao DESC";

            var encomendas = new List<Dictionary<string, object>>();
            using (SqlCommand cmd = new SqlCommand(queryEncomendas, conn))
            {
                cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);
                using SqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    encomendas.Add(new Dictionary<string, object>
                    {
                        ["id"] = reader["id_encomendas"],
                        ["dataCriacao"] = ((DateTime)reader["data_criacao"]).ToString("yyyy-MM-dd HH:mm"),
                        ["estado"] = reader["estado"].ToString(),
                        ["total"] = reader["total"],
                        ["moradaEntrega"] = reader.IsDBNull(reader.GetOrdinal("morada_entrega")) ? "" : reader["morada_entrega"].ToString(),
                        ["codigoPostal"] = reader.IsDBNull(reader.GetOrdinal("codigo_postal")) ? "" : reader["codigo_postal"].ToString(),
                        ["cidade"] = reader.IsDBNull(reader.GetOrdinal("cidade")) ? "" : reader["cidade"].ToString(),
                        ["notas"] = reader.IsDBNull(reader.GetOrdinal("notas")) ? "" : reader["notas"].ToString(),
                        ["items"] = new List<Dictionary<string, object>>()
                    });
                }
            }

            // Para cada encomenda, busca os itens via JOIN com produtos (nome e preco vêm de produtos)
            foreach (var enc in encomendas)
            {
                int encId = (int)enc["id"];
                string queryItems = @"
                    SELECT p.nome AS nome_produto, ei.preco_unitario, ei.quantidade
                    FROM encomenda_items ei
                    JOIN produtos p ON ei.id_produtos = p.id_produtos
                    WHERE ei.id_encomendas = @EncomendaId";

                using SqlCommand cmd = new SqlCommand(queryItems, conn);
                cmd.Parameters.AddWithValue("@EncomendaId", encId);
                using SqlDataReader reader = cmd.ExecuteReader();
                var items = (List<Dictionary<string, object>>)enc["items"];
                while (reader.Read())
                {
                    items.Add(new Dictionary<string, object>
                    {
                        ["nomeProduto"] = reader["nome_produto"].ToString(),
                        ["precoUnitario"] = reader["preco_unitario"],
                        ["quantidade"] = reader["quantidade"]
                    });
                }
            }

            return Ok(encomendas);
        }

        // GET api/encomendas/admin — lista todas as encomendas (admin)
        [HttpGet("admin")]
        public IActionResult GetTodasEncomendas()
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string queryEncomendas = @"
                SELECT e.id_encomendas, e.data_criacao, e.estado, e.total,
                       e.morada_entrega, e.codigo_postal, e.notas, cp.cidade,
                       u.nome AS nome_utilizador, u.email AS email_utilizador
                FROM encomendas e
                JOIN utilizadores u ON e.id_utilizadores = u.id_utilizadores
                LEFT JOIN codigos_postais cp ON e.codigo_postal = cp.codigo_postal
                ORDER BY e.data_criacao DESC";

            var encomendas = new List<Dictionary<string, object>>();
            using (SqlCommand cmd = new SqlCommand(queryEncomendas, conn))
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    encomendas.Add(new Dictionary<string, object>
                    {
                        ["id"] = reader["id_encomendas"],
                        ["dataCriacao"] = ((DateTime)reader["data_criacao"]).ToString("yyyy-MM-dd HH:mm"),
                        ["estado"] = reader["estado"].ToString(),
                        ["total"] = reader["total"],
                        ["moradaEntrega"] = reader.IsDBNull(reader.GetOrdinal("morada_entrega")) ? "" : reader["morada_entrega"].ToString(),
                        ["codigoPostal"] = reader.IsDBNull(reader.GetOrdinal("codigo_postal")) ? "" : reader["codigo_postal"].ToString(),
                        ["cidade"] = reader.IsDBNull(reader.GetOrdinal("cidade")) ? "" : reader["cidade"].ToString(),
                        ["notas"] = reader.IsDBNull(reader.GetOrdinal("notas")) ? "" : reader["notas"].ToString(),
                        ["nomeUtilizador"] = reader["nome_utilizador"].ToString(),
                        ["emailUtilizador"] = reader["email_utilizador"].ToString(),
                        ["items"] = new List<Dictionary<string, object>>()
                    });
                }
            }

            foreach (var enc in encomendas)
            {
                int encId = (int)enc["id"];
                string queryItems = @"
                    SELECT p.nome AS nome_produto, ei.preco_unitario, ei.quantidade
                    FROM encomenda_items ei
                    JOIN produtos p ON ei.id_produtos = p.id_produtos
                    WHERE ei.id_encomendas = @EncomendaId";

                using SqlCommand cmd = new SqlCommand(queryItems, conn);
                cmd.Parameters.AddWithValue("@EncomendaId", encId);
                using SqlDataReader reader = cmd.ExecuteReader();
                var items = (List<Dictionary<string, object>>)enc["items"];
                while (reader.Read())
                {
                    items.Add(new Dictionary<string, object>
                    {
                        ["nomeProduto"] = reader["nome_produto"].ToString(),
                        ["precoUnitario"] = reader["preco_unitario"],
                        ["quantidade"] = reader["quantidade"]
                    });
                }
            }

            return Ok(encomendas);
        }

        // POST api/encomendas/{id}/cancelar — cancela encomenda e devolve stock (admin)
        [HttpPost("{id}/cancelar")]
        public IActionResult CancelarEncomenda(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            // Verifica estado atual
            string estadoAtual;
            using (SqlCommand cmd = new SqlCommand(
                "SELECT estado FROM encomendas WHERE id_encomendas = @Id", conn))
            {
                cmd.Parameters.AddWithValue("@Id", id);
                var result = cmd.ExecuteScalar();
                if (result == null) return NotFound("Encomenda não encontrada.");
                estadoAtual = result.ToString();
            }

            if (estadoAtual == "cancelado")
                return BadRequest("A encomenda já se encontra cancelada.");
            if (estadoAtual == "entregue")
                return BadRequest("Não é possível cancelar uma encomenda já entregue.");

            using SqlTransaction transaction = conn.BeginTransaction();
            try
            {
                // Devolver stock de cada item
                string queryItens = "SELECT id_produtos, quantidade FROM encomenda_items WHERE id_encomendas = @Id";
                using (SqlCommand cmd = new SqlCommand(queryItens, conn, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using SqlDataReader reader = cmd.ExecuteReader();
                    var itens = new List<(int produtoId, int quantidade)>();
                    while (reader.Read())
                        itens.Add(((int)reader["id_produtos"], (int)reader["quantidade"]));
                    reader.Close();

                    foreach (var (produtoId, quantidade) in itens)
                    {
                        using SqlCommand upd = new SqlCommand(
                            "UPDATE produtos SET stock = stock + @Quantidade WHERE id_produtos = @ProdutoId",
                            conn, transaction);
                        upd.Parameters.AddWithValue("@Quantidade", quantidade);
                        upd.Parameters.AddWithValue("@ProdutoId", produtoId);
                        upd.ExecuteNonQuery();
                    }
                }

                // Atualizar estado para cancelado
                using (SqlCommand cmd = new SqlCommand(
                    "UPDATE encomendas SET estado = 'cancelado' WHERE id_encomendas = @Id",
                    conn, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.ExecuteNonQuery();
                }

                transaction.Commit();
                return Ok();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // PUT api/encomendas/{id}/estado — atualiza o estado de uma encomenda (admin)
        [HttpPut("{id}/estado")]
        public IActionResult AtualizarEstado(int id, [FromBody] string novoEstado)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            var estadosValidos = new[] { "pendente", "processado", "enviado", "entregue", "cancelado" };
            if (!estadosValidos.Contains(novoEstado))
                return BadRequest("Estado inválido.");

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            // Impede alteração de estados terminais
            using (SqlCommand chk = new SqlCommand(
                "SELECT estado FROM encomendas WHERE id_encomendas = @Id", conn))
            {
                chk.Parameters.AddWithValue("@Id", id);
                var estadoAtual = chk.ExecuteScalar()?.ToString();
                if (estadoAtual == null) return NotFound("Encomenda não encontrada.");
                if (estadoAtual == "cancelado" || estadoAtual == "entregue")
                    return BadRequest("Não é possível alterar o estado de uma encomenda já finalizada.");
            }

            using SqlCommand cmd = new SqlCommand(
                "UPDATE encomendas SET estado=@Estado WHERE id_encomendas=@Id", conn);
            cmd.Parameters.AddWithValue("@Estado", novoEstado);
            cmd.Parameters.AddWithValue("@Id", id);
            int rows = cmd.ExecuteNonQuery();

            if (rows == 0) return NotFound("Encomenda não encontrada.");
            return Ok();
        }
    }
}
