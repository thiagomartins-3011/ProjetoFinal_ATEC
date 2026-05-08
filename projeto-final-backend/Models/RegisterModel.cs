namespace ProjetoFinalBackend.Models
{
    public class RegisterModel
    {
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int Tipo { get; set; } = 0;
    }
}
