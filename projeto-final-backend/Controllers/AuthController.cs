using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using ProjetoFinalBackend.Models;
using ProjetoFinalBackend.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly string _jwtKey;
        private readonly string _frontendUrl;
        private readonly EmailService _emailService;

        public AuthController(IConfiguration config, EmailService emailService)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
            _jwtKey = config["Jwt:Key"];
            _frontendUrl = config["FrontendUrl"] ?? "http://localhost:5173";
            _emailService = emailService;
        }

        // ─────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────

        private string GerarJwt(string email, string tipo)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtKey);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Email, email),
                    new Claim("tipo", tipo)
                }),
                Expires = DateTime.UtcNow.AddHours(2),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };
            return tokenHandler.WriteToken(tokenHandler.CreateToken(descriptor));
        }

        private void InserirToken(SqlConnection conn, int utilizadorId, string tipo, string codigo, DateTime? expiraEm = null)
        {
            // Apaga tokens anteriores do mesmo tipo para este utilizador
            string deleteQuery = "DELETE FROM tokens_utilizadores WHERE id_utilizadores=@Uid AND tipo=@Tipo";
            using (SqlCommand del = new SqlCommand(deleteQuery, conn))
            {
                del.Parameters.AddWithValue("@Uid", utilizadorId);
                del.Parameters.AddWithValue("@Tipo", tipo);
                del.ExecuteNonQuery();
            }

            string insertQuery = "INSERT INTO tokens_utilizadores (id_utilizadores, tipo, codigo, expira_em) VALUES (@Uid, @Tipo, @Codigo, @Expira)";
            using (SqlCommand ins = new SqlCommand(insertQuery, conn))
            {
                ins.Parameters.AddWithValue("@Uid", utilizadorId);
                ins.Parameters.AddWithValue("@Tipo", tipo);
                ins.Parameters.AddWithValue("@Codigo", codigo);
                ins.Parameters.AddWithValue("@Expira", expiraEm.HasValue ? (object)expiraEm.Value : DBNull.Value);
                ins.ExecuteNonQuery();
            }
        }

        private void ApagarToken(SqlConnection conn, int tokenId)
        {
            using SqlCommand cmd = new SqlCommand("DELETE FROM tokens_utilizadores WHERE id_tokens_utilizadores=@Id", conn);
            cmd.Parameters.AddWithValue("@Id", tokenId);
            cmd.ExecuteNonQuery();
        }

        // ─────────────────────────────────────────────
        // Registo
        // ─────────────────────────────────────────────

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string checkQuery = "SELECT COUNT(*) FROM utilizadores WHERE email=@Email";
            using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
            {
                checkCmd.Parameters.AddWithValue("@Email", model.Email);
                if ((int)checkCmd.ExecuteScalar() > 0)
                    return BadRequest("Email já está em uso.");
            }

            var passwordHasher = new PasswordHasher<string>();
            string hashedPassword = passwordHasher.HashPassword(null, model.Password);

            string insertQuery = @"INSERT INTO utilizadores (nome, email, password, tipo, email_confirmado)
                                   OUTPUT INSERTED.id_utilizadores
                                   VALUES (@Nome, @Email, @Password, @Tipo, 0)";
            int novoId;
            using (SqlCommand insertCmd = new SqlCommand(insertQuery, conn))
            {
                insertCmd.Parameters.AddWithValue("@Nome", model.Nome);
                insertCmd.Parameters.AddWithValue("@Email", model.Email);
                insertCmd.Parameters.AddWithValue("@Password", hashedPassword);
                insertCmd.Parameters.AddWithValue("@Tipo", model.Tipo);
                novoId = (int)insertCmd.ExecuteScalar();
            }

            string token = Guid.NewGuid().ToString();
            InserirToken(conn, novoId, "confirmacao", token);

            string link = $"{_frontendUrl}/confirm-email?token={token}";
            _emailService.EnviarEmail(model.Email, "Confirmação de conta - SoundStore",
                $"Clica no link para ativar a tua conta: {link}");

            return Ok("Conta criada! Confirma o teu email para ativares a conta.");
        }

        // ─────────────────────────────────────────────
        // Confirmação de email
        // ─────────────────────────────────────────────

        [HttpGet("confirm-email")]
        public IActionResult ConfirmEmail([FromQuery] string token)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = @"SELECT t.id_tokens_utilizadores, u.id_utilizadores, u.email_confirmado
                             FROM tokens_utilizadores t
                             JOIN utilizadores u ON t.id_utilizadores = u.id_utilizadores
                             WHERE t.codigo=@Token AND t.tipo='confirmacao'";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Token", token);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return NotFound("Token inválido ou já utilizado.");

            int tokenId = (int)reader["id_tokens_utilizadores"];
            int utilizadorId = (int)reader["id_utilizadores"];
            bool jaConfirmado = (bool)reader["email_confirmado"];
            reader.Close();

            if (jaConfirmado)
            {
                ApagarToken(conn, tokenId);
                return Ok("Email já confirmado.");
            }

            string updateQuery = "UPDATE utilizadores SET email_confirmado=1 WHERE id_utilizadores=@Id";
            using (SqlCommand updateCmd = new SqlCommand(updateQuery, conn))
            {
                updateCmd.Parameters.AddWithValue("@Id", utilizadorId);
                updateCmd.ExecuteNonQuery();
            }

            ApagarToken(conn, tokenId);
            return Ok("Email confirmado com sucesso!");
        }

        // ─────────────────────────────────────────────
        // Login
        // ─────────────────────────────────────────────

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = "SELECT id_utilizadores, password, tipo, email_confirmado, two_factor_habilitado FROM utilizadores WHERE email=@Email";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return Unauthorized("E-mail ou password incorretos.");

            bool confirmado = (bool)reader["email_confirmado"];
            if (!confirmado)
            {
                reader.Close();
                return Unauthorized("Confirme o teu email antes de fazer login.");
            }

            int utilizadorId = (int)reader["id_utilizadores"];
            string storedHash = reader["password"].ToString();
            string tipoStr = reader["tipo"].ToString();
            bool isAdmin = tipoStr == "1";
            bool twoFactorHabilitado = (bool)reader["two_factor_habilitado"];
            reader.Close();

            var passwordHasher = new PasswordHasher<string>();
            var result = passwordHasher.VerifyHashedPassword(null, storedHash, model.Password);

            if (result != PasswordVerificationResult.Success)
                return Unauthorized("E-mail ou password incorretos.");

            if (isAdmin || twoFactorHabilitado)
            {
                string codigo = new Random().Next(100000, 999999).ToString();
                InserirToken(conn, utilizadorId, "2fa", codigo, DateTime.UtcNow.AddMinutes(10));

                _emailService.EnviarEmail(model.Email, "Código de verificação - SoundStore",
                    $"O teu código de verificação é: {codigo}\n\nExpira em 10 minutos.\nSe não foste tu, ignora este email.");

                return Ok(new { requires2fa = true });
            }

            return Ok(new { token = GerarJwt(model.Email, tipoStr) });
        }

        // ─────────────────────────────────────────────
        // Verificação 2FA
        // ─────────────────────────────────────────────

        [HttpPost("verify-2fa")]
        public IActionResult Verify2FA([FromBody] Verify2FAModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = @"SELECT t.id_tokens_utilizadores, t.codigo, t.expira_em, u.tipo
                             FROM tokens_utilizadores t
                             JOIN utilizadores u ON t.id_utilizadores = u.id_utilizadores
                             WHERE u.email=@Email AND t.tipo='2fa'";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return BadRequest("Nenhum código de verificação pendente.");

            int tokenId = (int)reader["id_tokens_utilizadores"];
            string codigoGuardado = reader["codigo"].ToString();
            DateTime expira = reader["expira_em"] != DBNull.Value
                ? (DateTime)reader["expira_em"]
                : DateTime.MinValue;
            string tipoStr = reader["tipo"].ToString();
            reader.Close();

            if (DateTime.UtcNow > expira)
            {
                ApagarToken(conn, tokenId);
                return BadRequest("O código expirou. Faz login novamente.");
            }

            if (codigoGuardado != model.Codigo)
                return Unauthorized("Código incorreto.");

            ApagarToken(conn, tokenId);
            return Ok(new { token = GerarJwt(model.Email, tipoStr) });
        }

        // ─────────────────────────────────────────────
        // Login com Google
        // ─────────────────────────────────────────────

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] TokenModel model)
        {
            using var client = new HttpClient();
            var response = await client.GetAsync($"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={model.Token}");

            if (!response.IsSuccessStatusCode)
                return BadRequest("Token inválido");

            var payload = await response.Content.ReadFromJsonAsync<GoogleTokenPayload>();
            string email = payload?.Email;
            string nome = payload?.Name ?? email;
            string tipoStr = "0";

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string checkQuery = "SELECT tipo FROM utilizadores WHERE email=@Email";
            using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
            {
                checkCmd.Parameters.AddWithValue("@Email", email);
                var existing = checkCmd.ExecuteScalar();

                if (existing == null)
                {
                    string insertQuery = "INSERT INTO utilizadores (nome, email, tipo, email_confirmado) VALUES (@Nome, @Email, 0, 1)";
                    using SqlCommand insertCmd = new SqlCommand(insertQuery, conn);
                    insertCmd.Parameters.AddWithValue("@Nome", nome);
                    insertCmd.Parameters.AddWithValue("@Email", email);
                    insertCmd.ExecuteNonQuery();
                }
                else
                {
                    tipoStr = Convert.ToInt32(existing).ToString();
                }
            }

            return Ok(new { token = GerarJwt(email, tipoStr) });
        }

        // ─────────────────────────────────────────────
        // Recuperação de password
        // ─────────────────────────────────────────────

        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = "SELECT id_utilizadores FROM utilizadores WHERE email=@Email";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            var result = cmd.ExecuteScalar();

            if (result == null)
                return NotFound("Email não encontrado.");

            int utilizadorId = (int)result;
            string token = Guid.NewGuid().ToString();
            InserirToken(conn, utilizadorId, "reset_password", token, DateTime.UtcNow.AddHours(1));

            string link = $"{_frontendUrl}/reset-password?token={token}";
            _emailService.EnviarEmail(model.Email, "Recuperação de password - SoundStore",
                $"Clica no link para redefinir a tua password: {link}");

            return Ok("Link de recuperação enviado para o teu email.");
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordModel model)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = @"SELECT t.id_tokens_utilizadores, t.expira_em, u.id_utilizadores
                             FROM tokens_utilizadores t
                             JOIN utilizadores u ON t.id_utilizadores = u.id_utilizadores
                             WHERE t.codigo=@Token AND t.tipo='reset_password'";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Token", model.Token);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return NotFound("Token inválido ou expirado.");

            int tokenId = (int)reader["id_tokens_utilizadores"];
            int utilizadorId = (int)reader["id_utilizadores"];
            DateTime expira = reader["expira_em"] != DBNull.Value
                ? (DateTime)reader["expira_em"]
                : DateTime.MinValue;
            reader.Close();

            if (DateTime.UtcNow > expira)
            {
                ApagarToken(conn, tokenId);
                return BadRequest("O link de recuperação expirou. Solicita um novo.");
            }

            var passwordHasher = new PasswordHasher<string>();
            string hashedPassword = passwordHasher.HashPassword(null, model.NovaSenha);

            string updateQuery = "UPDATE utilizadores SET password=@Password WHERE id_utilizadores=@Id";
            using (SqlCommand updateCmd = new SqlCommand(updateQuery, conn))
            {
                updateCmd.Parameters.AddWithValue("@Password", hashedPassword);
                updateCmd.Parameters.AddWithValue("@Id", utilizadorId);
                updateCmd.ExecuteNonQuery();
            }

            ApagarToken(conn, tokenId);
            return Ok("Password alterada com sucesso!");
        }

        // ─────────────────────────────────────────────
        // Alterar password (autenticado)
        // ─────────────────────────────────────────────

        [HttpPost("change-password")]
        [Authorize]
        public IActionResult ChangePassword([FromBody] ChangePasswordModel model)
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = "SELECT password FROM utilizadores WHERE email=@Email";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", email);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return NotFound("Utilizador não encontrado.");

            string storedHash = reader["password"].ToString();
            reader.Close();

            var passwordHasher = new PasswordHasher<string>();
            if (passwordHasher.VerifyHashedPassword(null, storedHash, model.CurrentPassword) != PasswordVerificationResult.Success)
                return Unauthorized("Password atual incorreta.");

            string newHash = passwordHasher.HashPassword(null, model.NewPassword);
            string updateQuery = "UPDATE utilizadores SET password=@Password WHERE email=@Email";
            using SqlCommand updateCmd = new SqlCommand(updateQuery, conn);
            updateCmd.Parameters.AddWithValue("@Password", newHash);
            updateCmd.Parameters.AddWithValue("@Email", email);
            updateCmd.ExecuteNonQuery();

            return Ok("Password alterada com sucesso!");
        }

        // ─────────────────────────────────────────────
        // Perfil do utilizador autenticado
        // ─────────────────────────────────────────────

        [HttpGet("me")]
        [Authorize]
        public IActionResult GetMe()
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string query = @"
                SELECT u.id_utilizadores, u.nome, u.email, u.tipo, u.two_factor_habilitado,
                       u.telefone, u.morada, u.codigo_postal, cp.cidade
                FROM utilizadores u
                LEFT JOIN codigos_postais cp ON u.codigo_postal = cp.codigo_postal
                WHERE u.email = @Email";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", email);
            SqlDataReader reader = cmd.ExecuteReader();

            if (!reader.Read())
                return NotFound();

            return Ok(new
            {
                id = reader["id_utilizadores"],
                nome = reader["nome"].ToString(),
                email = reader["email"].ToString(),
                tipo = reader["tipo"].ToString(),
                twoFactorHabilitado = (bool)reader["two_factor_habilitado"],
                telefone = reader["telefone"] != DBNull.Value ? reader["telefone"].ToString() : "",
                morada = reader["morada"] != DBNull.Value ? reader["morada"].ToString() : "",
                codigoPostal = reader["codigo_postal"] != DBNull.Value ? reader["codigo_postal"].ToString() : "",
                cidade = reader["cidade"] != DBNull.Value ? reader["cidade"].ToString() : ""
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public IActionResult UpdateProfile([FromBody] UpdateProfileModel model)
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            // Garantir que o código postal existe em codigos_postais antes de atualizar o perfil
            if (!string.IsNullOrWhiteSpace(model.CodigoPostal))
            {
                string cidade = string.IsNullOrWhiteSpace(model.Cidade) ? "Desconhecido" : model.Cidade.Trim();
                using SqlCommand cmdCP = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM codigos_postais WHERE codigo_postal = @CP)
                        INSERT INTO codigos_postais (codigo_postal, localidade, distrito, cidade)
                        VALUES (@CP, @Cidade, @Cidade, @Cidade)", conn);
                cmdCP.Parameters.AddWithValue("@CP", model.CodigoPostal.Trim());
                cmdCP.Parameters.AddWithValue("@Cidade", cidade);
                cmdCP.ExecuteNonQuery();
            }

            string query = @"UPDATE utilizadores
                             SET nome=@Nome, telefone=@Telefone, morada=@Morada, codigo_postal=@CodigoPostal
                             WHERE email=@Email";
            using SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Nome", string.Join(" ", (model.Nome ?? "").Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)));
            cmd.Parameters.AddWithValue("@Telefone", string.IsNullOrEmpty(model.Telefone) ? DBNull.Value : (object)model.Telefone);
            cmd.Parameters.AddWithValue("@Morada", string.IsNullOrEmpty(model.Morada) ? DBNull.Value : (object)model.Morada);
            cmd.Parameters.AddWithValue("@CodigoPostal", string.IsNullOrEmpty(model.CodigoPostal) ? DBNull.Value : (object)model.CodigoPostal);
            cmd.Parameters.AddWithValue("@Email", email);
            cmd.ExecuteNonQuery();

            return Ok("Perfil atualizado com sucesso.");
        }

        [HttpPost("toggle-2fa")]
        [Authorize]
        public IActionResult Toggle2FA()
        {
            string email = User.FindFirst(ClaimTypes.Email)?.Value;

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            string selectQuery = "SELECT two_factor_habilitado, tipo FROM utilizadores WHERE email=@Email";
            using SqlCommand selectCmd = new SqlCommand(selectQuery, conn);
            selectCmd.Parameters.AddWithValue("@Email", email);
            SqlDataReader reader = selectCmd.ExecuteReader();

            if (!reader.Read())
                return NotFound("Utilizador não encontrado.");

            bool currentStatus = (bool)reader["two_factor_habilitado"];
            string tipo = reader["tipo"].ToString();
            reader.Close();

            if (tipo == "1")
                return BadRequest("Administradores não podem desativar o 2FA.");

            string updateQuery = "UPDATE utilizadores SET two_factor_habilitado=@Status WHERE email=@Email";
            using SqlCommand updateCmd = new SqlCommand(updateQuery, conn);
            updateCmd.Parameters.AddWithValue("@Status", !currentStatus);
            updateCmd.Parameters.AddWithValue("@Email", email);
            updateCmd.ExecuteNonQuery();

            return Ok(new { habilitado = !currentStatus });
        }

        // ─────────────────────────────────────────────
        // Models auxiliares
        // ─────────────────────────────────────────────

        public class TokenModel { public string Token { get; set; } }
        public class GoogleTokenPayload { public string Email { get; set; } public string Name { get; set; } }
    }
}
