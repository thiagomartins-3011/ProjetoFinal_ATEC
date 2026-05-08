using System.Net;
using System.Net.Mail;

namespace ProjetoFinalBackend.Services
{
    public class EmailService
    {
        private readonly string _smtp;
        private readonly int _porta;
        private readonly string _endereco;
        private readonly string _password;

        public EmailService(IConfiguration config)
        {
            _smtp = config["Email:Smtp"];
            _porta = int.Parse(config["Email:Porta"]);
            _endereco = config["Email:Endereco"];
            _password = config["Email:Password"];
        }

        public void EnviarEmail(string destino, string assunto, string mensagem)
        {
            try
            {
                var smtp = new SmtpClient(_smtp, _porta)
                {
                    Credentials = new NetworkCredential(_endereco, _password),
                    EnableSsl = true
                };

                var mail = new MailMessage();
                mail.From = new MailAddress(_endereco);
                mail.To.Add(destino);
                mail.Subject = assunto;
                mail.Body = mensagem;

                smtp.Send(mail);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao enviar email: " + ex.Message);
                throw;
            }
        }
    }
}