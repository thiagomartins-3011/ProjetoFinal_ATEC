using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjetoFinalBackend.Models;
using ProjetoFinalBackend.Services;
using System.Collections.Generic;
using System.Security.Claims;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IWebHostEnvironment _env;
        private readonly ExpoNotificationService _notifications;

        public ProdutosController(IConfiguration config, IWebHostEnvironment env, ExpoNotificationService notifications)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
            _env = env;
            _notifications = notifications;
        }

        // GET api/produtos — lista produtos ativos com categorias ativas (público)
        [HttpGet]
        public IActionResult GetProdutos(
            [FromQuery] int? categoriaId,
            [FromQuery] bool incluirSubcategorias = false,
            [FromQuery] bool? emPromocao = null)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query;
            if (categoriaId.HasValue && incluirSubcategorias)
            {
                query = @"
                    WITH CatRecursiva AS (
                        SELECT id_categorias FROM categorias WHERE id_categorias = @CategoriaId
                        UNION ALL
                        SELECT c.id_categorias FROM categorias c
                        INNER JOIN CatRecursiva cr ON c.id_pai = cr.id_categorias
                    )
                    SELECT p.id_produtos, p.nome, p.descricao, p.preco, p.stock, p.ativo, ISNULL(p.promocao, 0) AS promocao,
                           p.id_categorias, cat.nome AS nome_categoria,
                           p.id_marcas, m.nome AS nome_marca,
                           (SELECT TOP 1 url FROM produto_imagens
                            WHERE id_produtos = p.id_produtos AND principal = 1) AS imagem_principal
                    FROM produtos p
                    INNER JOIN categorias cat ON p.id_categorias = cat.id_categorias
                    LEFT JOIN marcas m ON p.id_marcas = m.id_marcas
                    WHERE p.id_categorias IN (SELECT id_categorias FROM CatRecursiva)
                    AND p.ativo = 1
                    AND ISNULL(cat.ativa, 1) = 1
                    AND (@EmPromocao IS NULL OR (@EmPromocao = 1 AND ISNULL(p.promocao, 0) > 0) OR (@EmPromocao = 0 AND ISNULL(p.promocao, 0) = 0))";
            }
            else
            {
                query = @"
                    SELECT p.id_produtos, p.nome, p.descricao, p.preco, p.stock, p.ativo, ISNULL(p.promocao, 0) AS promocao,
                           p.id_categorias, cat.nome AS nome_categoria,
                           p.id_marcas, m.nome AS nome_marca,
                           (SELECT TOP 1 url FROM produto_imagens
                            WHERE id_produtos = p.id_produtos AND principal = 1) AS imagem_principal
                    FROM produtos p
                    INNER JOIN categorias cat ON p.id_categorias = cat.id_categorias
                    LEFT JOIN marcas m ON p.id_marcas = m.id_marcas
                    WHERE (@CategoriaId IS NULL OR p.id_categorias = @CategoriaId)
                    AND p.ativo = 1
                    AND ISNULL(cat.ativa, 1) = 1
                    AND (@EmPromocao IS NULL OR (@EmPromocao = 1 AND ISNULL(p.promocao, 0) > 0) OR (@EmPromocao = 0 AND ISNULL(p.promocao, 0) = 0))";
            }

            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@CategoriaId", (object)categoriaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@EmPromocao", emPromocao.HasValue ? (object)(emPromocao.Value ? 1 : 0) : DBNull.Value);

            using SqlDataReader reader = cmd.ExecuteReader();
            var produtos = new List<Dictionary<string, object>>();
            while (reader.Read())
            {
                produtos.Add(new Dictionary<string, object>
                {
                    ["id"] = reader["id_produtos"],
                    ["nome"] = reader["nome"],
                    ["descricao"] = reader.IsDBNull(reader.GetOrdinal("descricao")) ? null : reader["descricao"],
                    ["preco"] = reader["preco"],
                    ["stock"] = reader["stock"],
                    ["ativo"] = reader["ativo"],
                    ["promocao"] = reader["promocao"],
                    ["idCategoria"] = reader["id_categorias"],
                    ["nomeCategoria"] = reader["nome_categoria"],
                    ["idMarca"] = reader.IsDBNull(reader.GetOrdinal("id_marcas")) ? null : reader["id_marcas"],
                    ["nomeMarca"] = reader.IsDBNull(reader.GetOrdinal("nome_marca")) ? null : reader["nome_marca"],
                    ["imagemPrincipal"] = reader.IsDBNull(reader.GetOrdinal("imagem_principal")) ? null : reader["imagem_principal"]
                });
            }
            return Ok(produtos);
        }

        // GET api/produtos/admin — lista todos os produtos incluindo inativos (admin)
        [HttpGet("admin")]
        [Authorize]
        public IActionResult GetProdutosAdmin()
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = @"
                SELECT p.id_produtos, p.nome, p.descricao, p.preco, p.stock, p.ativo, ISNULL(p.promocao, 0) AS promocao,
                       p.id_categorias, cat.nome AS nome_categoria,
                       ISNULL(cat.ativa, 1) AS categoria_ativa,
                       p.id_marcas, m.nome AS nome_marca,
                       (SELECT TOP 1 url FROM produto_imagens
                        WHERE id_produtos = p.id_produtos AND principal = 1) AS imagem_principal
                FROM produtos p
                INNER JOIN categorias cat ON p.id_categorias = cat.id_categorias
                LEFT JOIN marcas m ON p.id_marcas = m.id_marcas";

            using SqlCommand cmd = new SqlCommand(query, conn);
            using SqlDataReader reader = cmd.ExecuteReader();
            var produtos = new List<Dictionary<string, object>>();
            while (reader.Read())
            {
                produtos.Add(new Dictionary<string, object>
                {
                    ["id"] = reader["id_produtos"],
                    ["nome"] = reader["nome"],
                    ["descricao"] = reader.IsDBNull(reader.GetOrdinal("descricao")) ? null : reader["descricao"],
                    ["preco"] = reader["preco"],
                    ["stock"] = reader["stock"],
                    ["ativo"] = reader["ativo"],
                    ["promocao"] = reader["promocao"],
                    ["idCategoria"] = reader["id_categorias"],
                    ["nomeCategoria"] = reader["nome_categoria"],
                    ["categoriaAtiva"] = (bool)reader["categoria_ativa"],
                    ["idMarca"] = reader.IsDBNull(reader.GetOrdinal("id_marcas")) ? null : reader["id_marcas"],
                    ["nomeMarca"] = reader.IsDBNull(reader.GetOrdinal("nome_marca")) ? null : reader["nome_marca"],
                    ["imagemPrincipal"] = reader.IsDBNull(reader.GetOrdinal("imagem_principal")) ? null : reader["imagem_principal"]
                });
            }
            return Ok(produtos);
        }

        // GET api/produtos/{id} — detalhe com todas as imagens (público)
        [HttpGet("{id}")]
        public IActionResult GetProduto(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                string query = @"
                    SELECT p.id_produtos, p.nome, p.descricao, p.preco, p.stock, p.ativo, ISNULL(p.promocao, 0) AS promocao,
                           p.id_categorias, cat.nome AS nome_categoria,
                           p.id_marcas, m.nome AS nome_marca
                    FROM produtos p
                    INNER JOIN categorias cat ON p.id_categorias = cat.id_categorias
                    LEFT JOIN marcas m ON p.id_marcas = m.id_marcas
                    WHERE p.id_produtos = @Id";

                Dictionary<string, object> produto;
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read())
                            return NotFound("Produto não encontrado.");

                        produto = new Dictionary<string, object>
                        {
                            ["id"] = reader["id_produtos"],
                            ["nome"] = reader["nome"],
                            ["descricao"] = reader.IsDBNull(reader.GetOrdinal("descricao")) ? null : reader["descricao"],
                            ["preco"] = reader["preco"],
                            ["stock"] = reader["stock"],
                            ["ativo"] = reader["ativo"],
                            ["promocao"] = reader["promocao"],
                            ["idCategoria"] = reader["id_categorias"],
                            ["nomeCategoria"] = reader["nome_categoria"],
                            ["idMarca"] = reader.IsDBNull(reader.GetOrdinal("id_marcas")) ? null : reader["id_marcas"],
                            ["nomeMarca"] = reader.IsDBNull(reader.GetOrdinal("nome_marca")) ? null : reader["nome_marca"]
                        };
                    }
                }

                // Busca as imagens do produto
                string imagensQuery = "SELECT id_produto_imagens, url, principal FROM produto_imagens WHERE id_produtos = @Id ORDER BY principal DESC";
                using (SqlCommand cmd = new SqlCommand(imagensQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        var imagens = new List<Dictionary<string, object>>();
                        while (reader.Read())
                        {
                            imagens.Add(new Dictionary<string, object>
                            {
                                ["id"] = reader["id_produto_imagens"],
                                ["url"] = reader["url"],
                                ["principal"] = reader["principal"]
                            });
                        }
                        produto["imagens"] = imagens;
                    }
                }

                return Ok(produto);
            }
        }

        // POST api/produtos — criar (admin)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateProduto([FromBody] ProdutoModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            int novoId;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = @"INSERT INTO produtos (nome, descricao, preco, stock, id_categorias, ativo, id_marcas, promocao)
                                 VALUES (@Nome, @Descricao, @Preco, @Stock, @IdCategoria, @Ativo, @IdMarca, @Promocao);
                                 SELECT SCOPE_IDENTITY();";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@Descricao", (object)model.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Preco", model.Preco);
                    cmd.Parameters.AddWithValue("@Stock", model.Stock);
                    cmd.Parameters.AddWithValue("@IdCategoria", model.IdCategoria);
                    cmd.Parameters.AddWithValue("@Ativo", model.Ativo);
                    cmd.Parameters.AddWithValue("@IdMarca", (object)model.IdMarca ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Promocao", model.Promocao);
                    novoId = Convert.ToInt32(cmd.ExecuteScalar());
                }
            }

            if (model.Ativo)
                await _notifications.EnviarParaTodosAsync(
                    "Novo produto disponível!",
                    $"{model.Nome} já está disponível na SoundStore.");

            return Ok(new { id = novoId, mensagem = "Produto criado com sucesso!" });
        }

        // PUT api/produtos/{id} — editar (admin)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduto(int id, [FromBody] ProdutoModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            int stockAntigo = 0;
            int promocaoAntiga = 0;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Ler valores antigos para detetar transições
                using (var cmd = new SqlCommand("SELECT stock, ISNULL(promocao, 0) FROM produtos WHERE id_produtos = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using var reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        stockAntigo = Convert.ToInt32(reader[0]);
                        promocaoAntiga = Convert.ToInt32(reader[1]);
                    }
                }

                string query = @"UPDATE produtos
                                 SET nome=@Nome, descricao=@Descricao, preco=@Preco,
                                     stock=@Stock, id_categorias=@IdCategoria, ativo=@Ativo,
                                     id_marcas=@IdMarca, promocao=@Promocao
                                 WHERE id_produtos=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@Descricao", (object)model.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Preco", model.Preco);
                    cmd.Parameters.AddWithValue("@Stock", model.Stock);
                    cmd.Parameters.AddWithValue("@IdCategoria", model.IdCategoria);
                    cmd.Parameters.AddWithValue("@Ativo", model.Ativo);
                    cmd.Parameters.AddWithValue("@IdMarca", (object)model.IdMarca ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Promocao", model.Promocao);
                    cmd.Parameters.AddWithValue("@Id", id);

                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Produto não encontrado.");
                }
            }

            // Notificações por transição (só se o produto está ativo)
            if (model.Ativo)
            {
                if (stockAntigo == 0 && model.Stock > 0)
                    await _notifications.EnviarParaTodosAsync(
                        "De volta ao stock!",
                        $"{model.Nome} voltou a estar disponível na SoundStore.");

                if (promocaoAntiga == 0 && model.Promocao > 0)
                    await _notifications.EnviarParaTodosAsync(
                        "Nova promoção!",
                        $"{model.Nome} está com {model.Promocao}% de desconto.");
            }

            return Ok("Produto atualizado com sucesso!");
        }

        // DELETE api/produtos/{id} — apagar (admin)
        [HttpDelete("{id}")]
        [Authorize]
        public IActionResult DeleteProduto(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                string checkEncomenda = "SELECT COUNT(*) FROM encomenda_items WHERE id_produtos=@Id";
                using (SqlCommand cmd = new SqlCommand(checkEncomenda, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    int count = (int)cmd.ExecuteScalar();
                    if (count > 0)
                        return BadRequest("Não é possível eliminar um produto que já está associado a encomendas.");
                }

                // Apaga as imagens do produto primeiro (FK)
                string deleteImagens = "DELETE FROM produto_imagens WHERE id_produtos=@Id";
                using (SqlCommand cmd = new SqlCommand(deleteImagens, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.ExecuteNonQuery();
                }

                string query = "DELETE FROM produtos WHERE id_produtos=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Produto não encontrado.");
                }
                return Ok("Produto apagado com sucesso!");
            }
        }

        // POST api/produtos/{id}/imagens — fazer upload de imagem (admin)
        [HttpPost("{id}/imagens")]
        [Authorize]
        public async Task<IActionResult> UploadImagem(int id, IFormFile ficheiro, [FromQuery] bool principal = false)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            if (ficheiro == null || ficheiro.Length == 0)
                return BadRequest("Nenhum ficheiro enviado.");

            var extensoesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extensao = Path.GetExtension(ficheiro.FileName).ToLower();
            if (!extensoesPermitidas.Contains(extensao))
                return BadRequest("Formato de imagem não suportado. Use jpg, png ou webp.");

            // Guarda o ficheiro em wwwroot/imagens/produtos/
            var pastaDestino = Path.Combine(_env.WebRootPath, "imagens", "produtos");
            Directory.CreateDirectory(pastaDestino);

            var nomeUnico = $"{Guid.NewGuid()}{extensao}";
            var caminhoCompleto = Path.Combine(pastaDestino, nomeUnico);

            using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await ficheiro.CopyToAsync(stream);
            }

            var urlRelativa = $"/imagens/produtos/{nomeUnico}";

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Se for marcada como principal, remove o principal anterior
                if (principal)
                {
                    string resetQuery = "UPDATE produto_imagens SET principal=0 WHERE id_produtos=@IdProduto";
                    using (SqlCommand cmd = new SqlCommand(resetQuery, conn))
                    {
                        cmd.Parameters.AddWithValue("@IdProduto", id);
                        cmd.ExecuteNonQuery();
                    }
                }

                string insertQuery = "INSERT INTO produto_imagens (id_produtos, url, principal) VALUES (@IdProduto, @Url, @Principal)";
                using (SqlCommand cmd = new SqlCommand(insertQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    cmd.Parameters.AddWithValue("@Url", urlRelativa);
                    cmd.Parameters.AddWithValue("@Principal", principal);
                    cmd.ExecuteNonQuery();
                }

                // Se só existe uma imagem, garante que é a principal
                string countQuery = "SELECT COUNT(*) FROM produto_imagens WHERE id_produtos=@IdProduto";
                using (SqlCommand cmd = new SqlCommand(countQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    int total = (int)cmd.ExecuteScalar();
                    if (total == 1)
                    {
                        string forcePrincipal = "UPDATE produto_imagens SET principal=1 WHERE id_produtos=@IdProduto";
                        using SqlCommand upd = new SqlCommand(forcePrincipal, conn);
                        upd.Parameters.AddWithValue("@IdProduto", id);
                        upd.ExecuteNonQuery();
                    }
                }
            }

            return Ok(new { url = urlRelativa });
        }

        // PUT api/produtos/{id}/imagens/{imagemId}/principal — definir imagem principal (admin)
        [HttpPut("{id}/imagens/{imagemId}/principal")]
        [Authorize]
        public IActionResult SetImagemPrincipal(int id, int imagemId)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                string resetQuery = "UPDATE produto_imagens SET principal=0 WHERE id_produtos=@IdProduto";
                using (SqlCommand cmd = new SqlCommand(resetQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    cmd.ExecuteNonQuery();
                }

                string setQuery = "UPDATE produto_imagens SET principal=1 WHERE id_produto_imagens=@ImagemId AND id_produtos=@IdProduto";
                using (SqlCommand cmd = new SqlCommand(setQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ImagemId", imagemId);
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Imagem não encontrada.");
                }
                return Ok("Imagem principal atualizada.");
            }
        }

        // DELETE api/produtos/{id}/imagens/{imagemId} — apagar imagem (admin)
        [HttpDelete("{id}/imagens/{imagemId}")]
        [Authorize]
        public IActionResult DeleteImagem(int id, int imagemId)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Busca o caminho do ficheiro antes de apagar
                string selectQuery = "SELECT url FROM produto_imagens WHERE id_produto_imagens=@ImagemId AND id_produtos=@IdProduto";
                string urlRelativa = null;
                using (SqlCommand cmd = new SqlCommand(selectQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ImagemId", imagemId);
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    var result = cmd.ExecuteScalar();
                    if (result == null)
                        return NotFound("Imagem não encontrada.");
                    urlRelativa = result.ToString();
                }

                // Apaga o registo da BD
                string deleteQuery = "DELETE FROM produto_imagens WHERE id_produto_imagens=@ImagemId AND id_produtos=@IdProduto";
                using (SqlCommand cmd = new SqlCommand(deleteQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ImagemId", imagemId);
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    cmd.ExecuteNonQuery();
                }

                // Apaga o ficheiro físico
                var caminhoFicheiro = Path.Combine(_env.WebRootPath, urlRelativa.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(caminhoFicheiro))
                    System.IO.File.Delete(caminhoFicheiro);

                // Se ficou só uma imagem, garante que é a principal
                string countQuery = "SELECT COUNT(*) FROM produto_imagens WHERE id_produtos=@IdProduto";
                using (SqlCommand cmd = new SqlCommand(countQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@IdProduto", id);
                    int total = (int)cmd.ExecuteScalar();
                    if (total == 1)
                    {
                        string forcePrincipal = "UPDATE produto_imagens SET principal=1 WHERE id_produtos=@IdProduto";
                        using SqlCommand upd = new SqlCommand(forcePrincipal, conn);
                        upd.Parameters.AddWithValue("@IdProduto", id);
                        upd.ExecuteNonQuery();
                    }
                }
            }

            return Ok("Imagem apagada com sucesso!");
        }
    }
}
