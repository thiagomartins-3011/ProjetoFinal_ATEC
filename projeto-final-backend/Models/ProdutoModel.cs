namespace ProjetoFinalBackend.Models
{
    public class ProdutoModel
    {
        public string Nome { get; set; }
        public string Descricao { get; set; }
        public decimal Preco { get; set; }
        public int Stock { get; set; }
        public int IdCategoria { get; set; }
        public bool Ativo { get; set; } = true;
        public int? IdMarca { get; set; }
        public int Promocao { get; set; } = 0;
    }
}
