using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjetoFinalBackend.Models;
using System.Security.Claims;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly string _connectionString;

        public NotificationsController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        [HttpPost("token")]
        [Authorize]
        public IActionResult SalvarToken([FromBody] PushTokenModel model)
        {
            if (string.IsNullOrWhiteSpace(model?.Token))
                return BadRequest("Token inválido.");

            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null) return Unauthorized();

            using var conn = new SqlConnection(_connectionString);
            conn.Open();

            int userId;
            using (var cmd = new SqlCommand("SELECT id_utilizadores FROM utilizadores WHERE email = @Email", conn))
            {
                cmd.Parameters.AddWithValue("@Email", email);
                var result = cmd.ExecuteScalar();
                if (result == null) return Unauthorized();
                userId = Convert.ToInt32(result);
            }

            string upsert = @"
                IF EXISTS (SELECT 1 FROM push_tokens WHERE id_utilizadores = @Id)
                    UPDATE push_tokens SET token = @Token, atualizado_em = GETDATE() WHERE id_utilizadores = @Id
                ELSE
                    INSERT INTO push_tokens (id_utilizadores, token, atualizado_em) VALUES (@Id, @Token, GETDATE())";

            using (var cmd = new SqlCommand(upsert, conn))
            {
                cmd.Parameters.AddWithValue("@Id", userId);
                cmd.Parameters.AddWithValue("@Token", model.Token);
                cmd.ExecuteNonQuery();
            }

            return Ok();
        }
    }
}
