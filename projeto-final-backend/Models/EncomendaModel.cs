namespace ProjetoFinalBackend.Models
{
    public class EncomendaModel
    {
        public string MoradaEntrega { get; set; }
        public string CodigoPostal { get; set; }
        public string Cidade { get; set; }
        public string Notas { get; set; }
        public List<EncomendaItemModel> Items { get; set; }
    }

    public class EncomendaItemModel
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }
}
