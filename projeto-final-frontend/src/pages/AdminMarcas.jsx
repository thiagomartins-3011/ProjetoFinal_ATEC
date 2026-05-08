import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function AdminMarcas() {
  const [marcas, setMarcas] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [editando, setEditando] = useState(null); // { id, nome }
  const [novaNome, setNovaNome] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const showMsg = (msg) => {
    setMensagem(typeof msg === "string" && msg ? msg : "Ocorreu um erro inesperado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setMensagem(""), 3500);
  };

  const fetchMarcas = async () => {
    try {
      const res = await axios.get(`${API}/api/marcas`);
      setMarcas(res.data);
    } catch {
      showMsg("Erro ao carregar marcas.");
    }
  };

  useEffect(() => { fetchMarcas(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const nome = novaNome.trim();
    if (!nome) return;
    try {
      await axios.post(`${API}/api/marcas`, JSON.stringify(nome), { headers: authHeaders });
      setNovaNome("");
      setShowAddForm(false);
      fetchMarcas();
      showMsg("Marca criada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao criar marca.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const nome = editando.nome.trim();
    if (!nome) return;
    try {
      await axios.put(`${API}/api/marcas/${editando.id}`, JSON.stringify(nome), { headers: authHeaders });
      setEditando(null);
      fetchMarcas();
      showMsg("Marca atualizada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao atualizar marca.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar esta marca?")) return;
    try {
      await axios.delete(`${API}/api/marcas/${id}`, { headers: authHeaders });
      if (editando?.id === id) setEditando(null);
      fetchMarcas();
      showMsg("Marca eliminada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao eliminar marca.");
    }
  };

  const handleSort = (col) => {
    if (sortColumn === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortColumn(col); setSortOrder("asc"); }
  };

  const sortIndicator = (col) =>
    sortColumn !== col ? " ↕" : sortOrder === "asc" ? " ▲" : " ▼";

  const marcasFiltradas = marcas.filter((m) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      m.id?.toString().includes(term) ||
      m.nome?.toLowerCase().includes(term)
    );
  });

  const marcasSorted = [...marcasFiltradas].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA = a[sortColumn];
    let valB = b[sortColumn];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const formStyle = {
    marginTop: "24px",
    padding: "24px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "16px",
    border: "1px solid var(--glass-border)",
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div className="card card-wide" style={{ maxWidth: "780px" }}>
        <h2>Gestão de Marcas</h2>
        <p className="card-subtitle">Administra as marcas dos produtos da loja</p>

        {mensagem && <div className="msg msg-info">{mensagem}</div>}

        {/* Formulário de edição */}
        {editando && (
          <form onSubmit={handleUpdate} style={formStyle}>
            <h3>Editar Marca</h3>
            <div className="input-group">
              <label>Nome</label>
              <input
                className="input-field"
                value={editando.nome}
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Barra de pesquisa */}
        <div className="search-bar" style={{ marginTop: "24px" }}>
          <input
            className="input-field"
            placeholder="Pesquisar marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabela */}
        <div className="table-wrapper" style={{ marginTop: "16px" }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                  ID{sortIndicator("id")}
                </th>
                <th onClick={() => handleSort("nome")} style={{ cursor: "pointer" }}>
                  Nome{sortIndicator("nome")}
                </th>
                <th onClick={() => handleSort("totalProdutos")} style={{ cursor: "pointer" }}>
                  Produtos{sortIndicator("totalProdutos")}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {marcasSorted.map((marca) => (
                <tr key={marca.id}>
                  <td>{marca.id}</td>
                  <td style={{ fontWeight: 600 }}>{marca.nome}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: marca.totalProdutos === 0 ? "var(--text-secondary)" : "inherit" }}>
                      {marca.totalProdutos}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn btn-edit"
                        onClick={() => { setEditando({ id: marca.id, nome: marca.nome }); setShowAddForm(false); }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(marca.id)}
                        title={marca.totalProdutos > 0 ? "Marca associada a produtos" : "Eliminar"}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {marcasSorted.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
                    {search ? "Nenhuma marca encontrada." : "Ainda não há marcas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Botão + formulário de adição */}
        <div style={{ marginTop: "24px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => { setShowAddForm((v) => !v); setEditando(null); }}
          >
            {showAddForm ? "✕ Cancelar" : "+ Adicionar Marca"}
          </button>

          {showAddForm && (
            <form onSubmit={handleCreate} style={formStyle}>
              <h3>Nova Marca</h3>
              <div className="input-group">
                <label>Nome</label>
                <input
                  className="input-field"
                  placeholder="Ex: Fender, Yamaha..."
                  value={novaNome}
                  onChange={(e) => setNovaNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Criar Marca
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
