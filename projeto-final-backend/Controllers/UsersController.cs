using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjetoFinalBackend.Models;
using System.Collections.Generic;
using System.Security.Claims;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly string _connectionString;

        public UsersController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = "SELECT * FROM utilizadores";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    var users = new List<Dictionary<string, object>>();

                    while (reader.Read())
                    {
                        var user = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            user[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        }
                        users.Add(user);
                    }

                    return Ok(users);
                }
            }
        }

        [HttpPost]
        public IActionResult CreateUser([FromBody] RegisterModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Verifica se já existe
                string checkQuery = "SELECT COUNT(*) FROM utilizadores WHERE email=@Email";
                using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("@Email", model.Email);
                    int count = (int)checkCmd.ExecuteScalar();
                    if (count > 0)
                        return BadRequest("Email já existe.");
                }

                var passwordHasher = new PasswordHasher<string>();
                string hashedPassword = passwordHasher.HashPassword(null, model.Password);

                string query = @"INSERT INTO utilizadores (nome, email, password, tipo, email_confirmado)
                         VALUES (@Nome, @Email, @Password, @Tipo, 1)";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@Email", model.Email);
                    cmd.Parameters.AddWithValue("@Password", hashedPassword);
                    cmd.Parameters.AddWithValue("@Tipo", model.Tipo);

                    cmd.ExecuteNonQuery();
                }

                return Ok("Utilizador criado com sucesso!");
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, [FromBody] RegisterModel model)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                string query = @"
                UPDATE utilizadores
                SET nome=@Nome, email=@Email, tipo=@Tipo
                WHERE id_utilizadores=@Id";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Nome", model.Nome);
                    cmd.Parameters.AddWithValue("@Email", model.Email);
                    cmd.Parameters.AddWithValue("@Tipo", model.Tipo);
                    cmd.Parameters.AddWithValue("@Id", id);

                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Utilizador não encontrado.");
                }

                return Ok("Utilizador atualizado com sucesso!");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // Verifica se o utilizador tem encomendas ativas (não canceladas nem entregues)
                string checkEncomendasQuery = @"
                    SELECT COUNT(*) FROM encomendas
                    WHERE id_utilizadores = @Id
                    AND estado NOT IN ('cancelado', 'entregue')";
                using (SqlCommand checkCmd = new SqlCommand(checkEncomendasQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("@Id", id);
                    int encomendasAtivas = (int)checkCmd.ExecuteScalar();
                    if (encomendasAtivas > 0)
                        return Conflict("Não é possível eliminar este utilizador porque tem encomendas ativas (pendentes, processadas ou enviadas).");
                }

                // Apaga os itens das encomendas finalizadas (cancelado/entregue) do utilizador
                using (SqlCommand delEncItems = new SqlCommand(@"
                    DELETE ei FROM encomenda_items ei
                    JOIN encomendas e ON ei.id_encomendas = e.id_encomendas
                    WHERE e.id_utilizadores = @Id AND e.estado IN ('cancelado', 'entregue')", conn))
                {
                    delEncItems.Parameters.AddWithValue("@Id", id);
                    delEncItems.ExecuteNonQuery();
                }

                // Apaga as encomendas finalizadas do utilizador
                using (SqlCommand delEnc = new SqlCommand(@"
                    DELETE FROM encomendas
                    WHERE id_utilizadores = @Id AND estado IN ('cancelado', 'entregue')", conn))
                {
                    delEnc.Parameters.AddWithValue("@Id", id);
                    delEnc.ExecuteNonQuery();
                }

                // Apaga os itens do carrinho antes de apagar o utilizador
                using (SqlCommand delCarrinho = new SqlCommand("DELETE FROM carrinho_itens WHERE id_utilizadores = @Id", conn))
                {
                    delCarrinho.Parameters.AddWithValue("@Id", id);
                    delCarrinho.ExecuteNonQuery();
                }

                // Apaga os tokens do utilizador
                using (SqlCommand delTokens = new SqlCommand("DELETE FROM tokens_utilizadores WHERE id_utilizadores = @Id", conn))
                {
                    delTokens.Parameters.AddWithValue("@Id", id);
                    delTokens.ExecuteNonQuery();
                }

                // Apaga o utilizador
                using (SqlCommand delUser = new SqlCommand("DELETE FROM utilizadores WHERE id_utilizadores = @Id", conn))
                {
                    delUser.Parameters.AddWithValue("@Id", id);
                    int rows = delUser.ExecuteNonQuery();
                    if (rows == 0)
                        return NotFound("Utilizador não encontrado.");
                }

                return Ok("Utilizador eliminado com sucesso!");
            }
        }
    }
}