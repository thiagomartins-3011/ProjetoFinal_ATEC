using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace ProjetoFinalBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarcasController : ControllerBase
    {
        private readonly string _connectionString;

        public MarcasController(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        // GET api/marcas — lista todas as marcas (público)
        [HttpGet]
        public IActionResult GetMarcas()
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            using SqlCommand cmd = new SqlCommand(
                @"SELECT m.id_marcas, m.nome,
                         COUNT(p.id_produtos) AS totalProdutos
                  FROM marcas m
                  LEFT JOIN produtos p ON p.id_marcas = m.id_marcas
                  GROUP BY m.id_marcas, m.nome
                  ORDER BY m.nome", conn);
            using SqlDataReader reader = cmd.ExecuteReader();

            var marcas = new List<object>();
            while (reader.Read())
                marcas.Add(new
                {
                    id = (int)reader["id_marcas"],
                    nome = reader["nome"].ToString(),
                    totalProdutos = (int)reader["totalProdutos"]
                });

            return Ok(marcas);
        }

        // PUT api/marcas/{id} — renomear marca (admin)
        [HttpPut("{id}")]
        [Authorize]
        public IActionResult UpdateMarca(int id, [FromBody] string nome)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();
            if (string.IsNullOrWhiteSpace(nome)) return BadRequest("Nome inválido.");

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            using SqlCommand cmd = new SqlCommand(
                "UPDATE marcas SET nome=@Nome WHERE id_marcas=@Id", conn);
            cmd.Parameters.AddWithValue("@Nome", nome.Trim());
            cmd.Parameters.AddWithValue("@Id", id);
            int rows = cmd.ExecuteNonQuery();
            if (rows == 0) return NotFound("Marca não encontrada.");
            return Ok(new { id, nome = nome.Trim() });
        }

        // POST api/marcas — criar marca (admin)
        [HttpPost]
        [Authorize]
        public IActionResult CreateMarca([FromBody] string nome)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();
            if (string.IsNullOrWhiteSpace(nome)) return BadRequest("Nome inválido.");

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            using SqlCommand cmd = new SqlCommand(
                "INSERT INTO marcas (nome) OUTPUT INSERTED.id_marcas VALUES (@Nome)", conn);
            cmd.Parameters.AddWithValue("@Nome", nome.Trim());
            int id = (int)cmd.ExecuteScalar();
            return Ok(new { id, nome = nome.Trim() });
        }

        // DELETE api/marcas/{id} — apagar marca (admin)
        [HttpDelete("{id}")]
        [Authorize]
        public IActionResult DeleteMarca(int id)
        {
            if (User.FindFirst("tipo")?.Value != "1") return Forbid();

            using SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();

            // Verifica se há produtos com esta marca
            using (SqlCommand chk = new SqlCommand(
                "SELECT COUNT(*) FROM produtos WHERE id_marcas=@Id", conn))
            {
                chk.Parameters.AddWithValue("@Id", id);
                if ((int)chk.ExecuteScalar() > 0)
                    return BadRequest("Não é possível apagar uma marca associada a produtos.");
            }

            using SqlCommand cmd = new SqlCommand(
                "DELETE FROM marcas WHERE id_marcas=@Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            int rows = cmd.ExecuteNonQuery();
            if (rows == 0) return NotFound("Marca não encontrada.");
            return Ok();
        }
    }
}
