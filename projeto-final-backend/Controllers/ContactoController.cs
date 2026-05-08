using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjetoFinalBackend.Services;

namespace ProjetoFinalBackend.Controllers
{
    public class ContactoModel
    {
        public string Nome { get; set; } = "";
        public string Email { get; set; } = "";
        public string Assunto { get; set; } = "";
        public string Mensagem { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ContactoController : ControllerBase
    {
        private readonly EmailService _email;
        private readonly IConfiguration _config;

        public ContactoController(EmailService email, IConfiguration config)
        {
            _email = email;
            _config = config;
        }

        [HttpPost]
        [AllowAnonymous]
        public IActionResult EnviarMensagem([FromBody] ContactoModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Nome) ||
                string.IsNullOrWhiteSpace(model.Email) ||
                string.IsNullOrWhiteSpace(model.Assunto) ||
                string.IsNullOrWhiteSpace(model.Mensagem))
                return BadRequest("Todos os campos são obrigatórios.");

            var destinatario = _config["Email:Endereco"]!;
            var assunto = $"[SoundStore Contacto] {model.Assunto}";
            var corpo = $"Nome: {model.Nome}\nE-mail: {model.Email}\n\n{model.Mensagem}";

            _email.EnviarEmail(destinatario, assunto, corpo);
            return Ok();
        }
    }
}
