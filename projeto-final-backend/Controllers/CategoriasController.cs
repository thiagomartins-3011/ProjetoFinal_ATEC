using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjetoFinalBackend.Models;
using System.Collections.Generic;
using System.Security.Claims;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly string _connectionString;

        public CategoriasController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        // GET api/categorias — lista só as ativas (público)
        [HttpGet]
        public IActionResult GetCategorias()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = @"
                    SELECT c.id_categorias, c.nome, c.id_pai,
                           COUNT(p.id_produtos) AS total_produtos
                    FROM categorias c
                    LEFT JOIN produtos p ON p.id_categorias = c.id_categorias
                    WHERE ISNULL(c.ativa, 1) = 1
                    GROUP BY c.id_categorias, c.nome, c.id_pai";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    var categorias = new List<Dictionary<string, object>>();
                    while (reader.Read())
                    {
                        categorias.Add(new Dictionary<string, object>
                        {
                            ["id"] = reader["id_categorias"],
                            ["nome"] = reader["nome"],
                            ["idPai"] = reader.IsDBNull(reader.GetOrdinal("id_pai")) ? null : reader["id_pai"],
                            ["totalProdutos"] = reader["total_produtos"]
                        });
                    }
                    return Ok(categorias);
                }
            }
        }

        // GET api/categorias/admin — lista todas incluindo inativas (admin)
        [HttpGet("admin")]
        [Authorize]
        public IActionResult GetCategoriasAdmin()
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = @"
                    SELECT c.id_categorias, c.nome, c.id_pai, ISNULL(c.ativa, 1) AS ativa,
                           COUNT(p.id_produtos) AS total_produtos
                    FROM categorias c
                    LEFT JOIN produtos p ON p.id_categorias = c.id_categorias
                    GROUP BY c.id_categorias, c.nome, c.id_pai, ISNULL(c.ativa, 1)";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    var categorias = new List<Dictionary<string, object>>();
                    while (reader.Read())
                    {
                        categorias.Add(new Dictionary<string, object>
                        {
                            ["id"] = reader["id_categorias"],
                            ["nome"] = reader["nome"],
                            ["idPai"] = reader.IsDBNull(reader.GetOrdinal("id_pai")) ? null : reader["id_pai"],
                            ["ativa"] = (bool)reader["ativa"],
                            ["totalProdutos"] = reader["total_produtos"]
                        });
                    }
                    return Ok(categorias);
                }
            }
        }

        // GET api/categorias/{id} — detalhe (público)
        [HttpGet("{id}")]
        public IActionResult GetCategoria(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = "SELECT id_categorias, nome, id_pai FROM categorias WHERE id_categorias=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read())
                            return NotFound("Categoria não encontrada.");

                        var categoria = new Dictionary<string, object>
                        {
                            ["id"] = reader["id_categorias"],
                            ["nome"] = reader["nome"],
                            ["idPai"] = reader.IsDBNull(reader.GetOrdinal("id_pai")) ? null : reader["id_pai"]
                        };
                        return Ok(categoria);
                    }
                }
            }
        }

        // POST api/categorias — criar (admin)
        [HttpPost]
        [Authorize]
        public IActionResult CreateCategoria([FromBody] CategoriaModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = "INSERT INTO categorias (nome, id_pai, ativa) VALUES (@Nome, @IdPai, 1)";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@IdPai", (object)model.IdPai ?? DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
                return Ok("Categoria criada com sucesso!");
            }
        }

        // PUT api/categorias/{id} — editar (admin)
        [HttpPut("{id}")]
        [Authorize]
        public IActionResult UpdateCategoria(int id, [FromBody] CategoriaModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = "UPDATE categorias SET nome=@Nome, id_pai=@IdPai WHERE id_categorias=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@IdPai", (object)model.IdPai ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Id", id);

                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Categoria não encontrada.");
                }
                return Ok("Categoria atualizada com sucesso!");
            }
        }

        // DELETE api/categorias/{id} — inativar (soft delete) (admin)
        [HttpDelete("{id}")]
        [Authorize]
        public IActionResult InativarCategoria(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Bloqueia se houver subcategorias ativas
                string checkSubQuery = "SELECT COUNT(*) FROM categorias WHERE id_pai=@Id AND ISNULL(ativa,1)=1";
                using (SqlCommand checkCmd = new SqlCommand(checkSubQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("@Id", id);
                    int count = (int)checkCmd.ExecuteScalar();
                    if (count > 0)
                        return BadRequest("Não é possível inativar uma categoria com subcategorias ativas. Inativa primeiro as subcategorias.");
                }

                string query = "UPDATE categorias SET ativa=0 WHERE id_categorias=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Categoria não encontrada.");
                }

                // Inativa todos os produtos desta categoria
                string inativarProdutos = "UPDATE produtos SET ativo=0 WHERE id_categorias=@Id";
                using (SqlCommand cmd = new SqlCommand(inativarProdutos, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.ExecuteNonQuery();
                }

                return Ok("Categoria inativada com sucesso!");
            }
        }

        // PUT api/categorias/{id}/reativar — reativar categoria (admin)
        [HttpPut("{id}/reativar")]
        [Authorize]
        public IActionResult ReativarCategoria(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = "UPDATE categorias SET ativa=1 WHERE id_categorias=@Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Categoria não encontrada.");
                }
                return Ok("Categoria reativada com sucesso!");
            }
        }
    }
}
