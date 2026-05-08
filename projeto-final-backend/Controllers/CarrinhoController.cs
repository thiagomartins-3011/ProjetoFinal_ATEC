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
    public class CarrinhoController : ControllerBase
    {
        private readonly string _connectionString;

        public CarrinhoController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        private int GetUtilizadorId(SqlConnection conn)
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;
            using SqlCommand cmd = new SqlCommand(
                "SELECT id_utilizadores FROM utilizadores WHERE email=@Email", conn);
            cmd.Parameters.AddWithValue("@Email", email);
            var result = cmd.ExecuteScalar();
            return result != null ? (int)result : -1;
        }

        // GET api/carrinho — devolve os itens do carrinho do utilizador autenticado
        [HttpGet]
        public IActionResult GetCarrinho()
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            int utilizadorId = GetUtilizadorId(conn);
            if (utilizadorId < 0) return NotFound("Utilizador não encontrado.");

            string query = @"
                SELECT ci.id_produtos, ci.quantidade,
                       p.nome, p.preco, p.stock, p.ativo,
                       p.id_categorias, c.nome AS nome_categoria,
                       (SELECT TOP 1 url FROM produto_imagens
                        WHERE id_produtos = p.id_produtos AND principal = 1) AS imagem_principal
                FROM carrinho_itens ci
                INNER JOIN produtos p ON ci.id_produtos = p.id_produtos
                INNER JOIN categorias c ON p.id_categorias = c.id_categorias
                WHERE ci.id_utilizadores = @UtilizadorId AND p.ativo = 1";

            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);

            var itens = new List<object>();
            using SqlDataReader reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                itens.Add(new
                {
                    produto = new
                    {
                        id = (int)reader["id_produtos"],
                        nome = reader["nome"].ToString(),
                        preco = (decimal)reader["preco"],
                        stock = (int)reader["stock"],
                        ativo = (bool)reader["ativo"],
                        idCategoria = (int)reader["id_categorias"],
                        nomeCategoria = reader["nome_categoria"].ToString(),
                        imagemPrincipal = reader.IsDBNull(reader.GetOrdinal("imagem_principal"))
                            ? null
                            : reader["imagem_principal"].ToString()
                    },
                    quantidade = (int)reader["quantidade"]
                });
            }
            return Ok(itens);
        }

        // POST api/carrinho — adiciona ou atualiza a quantidade de um item
        [HttpPost]
        public IActionResult UpsertItem([FromBody] CarrinhoItemModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            int utilizadorId = GetUtilizadorId(conn);
            if (utilizadorId < 0) return NotFound("Utilizador não encontrado.");

            int stock;
            using (SqlCommand cmdStock = new SqlCommand(
                "SELECT stock FROM produtos WHERE id_produtos=@Id AND ativo=1", conn))
            {
                cmdStock.Parameters.AddWithValue("@Id", model.ProdutoId);
                var result = cmdStock.ExecuteScalar();
                if (result == null) return NotFound("Produto não encontrado.");
                stock = (int)result;
            }

            int quantidade = Math.Min(model.Quantidade, stock);
            if (quantidade <= 0) return BadRequest("Quantidade inválida.");

            string upsert = @"
                IF EXISTS (SELECT 1 FROM carrinho_itens
                           WHERE id_utilizadores=@UtilizadorId AND id_produtos=@ProdutoId)
                    UPDATE carrinho_itens
                       SET quantidade=@Quantidade
                     WHERE id_utilizadores=@UtilizadorId AND id_produtos=@ProdutoId
                ELSE
                    INSERT INTO carrinho_itens (id_utilizadores, id_produtos, quantidade)
                    VALUES (@UtilizadorId, @ProdutoId, @Quantidade)";

            using SqlCommand cmd = new SqlCommand(upsert, conn);
            cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);
            cmd.Parameters.AddWithValue("@ProdutoId", model.ProdutoId);
            cmd.Parameters.AddWithValue("@Quantidade", quantidade);
            cmd.ExecuteNonQuery();

            return Ok();
        }

        // DELETE api/carrinho/{produtoId} — remove um item específico
        [HttpDelete("{produtoId}")]
        public IActionResult RemoverItem(int produtoId)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            int utilizadorId = GetUtilizadorId(conn);
            if (utilizadorId < 0) return NotFound();

            using SqlCommand cmd = new SqlCommand(
                "DELETE FROM carrinho_itens WHERE id_utilizadores=@UtilizadorId AND id_produtos=@ProdutoId", conn);
            cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);
            cmd.Parameters.AddWithValue("@ProdutoId", produtoId);
            cmd.ExecuteNonQuery();
            return Ok();
        }

        // DELETE api/carrinho — limpa todo o carrinho do utilizador
        [HttpDelete]
        public IActionResult LimparCarrinho()
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            int utilizadorId = GetUtilizadorId(conn);
            if (utilizadorId < 0) return NotFound();

            using SqlCommand cmd = new SqlCommand(
                "DELETE FROM carrinho_itens WHERE id_utilizadores=@UtilizadorId", conn);
            cmd.Parameters.AddWithValue("@UtilizadorId", utilizadorId);
            cmd.ExecuteNonQuery();
            return Ok();
        }
    }
}
