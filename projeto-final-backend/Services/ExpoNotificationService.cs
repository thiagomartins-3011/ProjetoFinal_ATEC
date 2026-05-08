using Microsoft.Data.SqlClient;
using System.Text;
using System.Text.Json;

namespace ProjetoFinalBackend.Services
{
    public class ExpoNotificationService
    {
        private readonly HttpClient _http;
        private readonly string _connectionString;

        public ExpoNotificationService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public async Task EnviarParaTodosAsync(string titulo, string corpo)
        {
            var tokens = new List<string>();
            using (var conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using var cmd = new SqlCommand("SELECT token FROM push_tokens", conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                    tokens.Add(reader.GetString(0));
            }

            if (tokens.Count == 0) return;

            var messages = tokens.Select(t => new { to = t, title = titulo, body = corpo });
            var json = JsonSerializer.Serialize(messages);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                await _http.PostAsync("https://exp.host/--/api/v2/push/send", content);
            }
            catch { }
        }
    }
}
