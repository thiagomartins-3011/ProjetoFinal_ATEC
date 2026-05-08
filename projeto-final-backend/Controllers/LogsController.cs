using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public LogsController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // GET api/logs — devolve as últimas N linhas do ficheiro de log (admin only)
        [HttpGet]
        [Authorize]
        public IActionResult GetLogs([FromQuery] int linhas = 300)
        {
            if (User.FindFirst("tipo")?.Value != "1")
                return Forbid();

            var logsDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");

            if (!Directory.Exists(logsDir))
                return Ok(new { logs = new List<string>(), ficheiro = (string?)null });

            var ficheiro = Directory.GetFiles(logsDir, "log-*.txt")
                .OrderByDescending(f => f)
                .FirstOrDefault();

            if (ficheiro == null)
                return Ok(new { logs = new List<string>(), ficheiro = (string?)null });

            string conteudo;
            using (var stream = new FileStream(ficheiro, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (var reader = new StreamReader(stream))
            {
                conteudo = reader.ReadToEnd();
            }

            var todasLinhas = conteudo.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var ultimasLinhas = todasLinhas.TakeLast(linhas).ToList();

            return Ok(new
            {
                logs = ultimasLinhas,
                ficheiro = Path.GetFileName(ficheiro),
                total = todasLinhas.Length
            });
        }
    }
}
