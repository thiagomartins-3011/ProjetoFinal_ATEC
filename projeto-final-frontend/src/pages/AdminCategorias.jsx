import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function AdminCategorias({ onCategoriasMudaram }) {
  const [categorias, setCategorias] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [editando, setEditando] = useState(null);
  const [addMode, setAddMode] = useState(null); // null | "principal" | "subcategoria"
  const [novaCategoria, setNovaCategoria] = useState({ nome: "", idPai: "" });
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const showMsg = (msg) => {
    setMensagem(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setMensagem(""), 3500);
  };

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API}/api/categorias/admin`, { headers: authHeaders });
      setCategorias(res.data);
    } catch {
      // silencioso — lista já estava carregada
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const nomeCategoriaCompleto = (cat) => {
    const pai = categorias.find((c) => c.id === cat.idPai);
    return pai ? `${pai.nome} ${cat.nome}` : cat.nome;
  };

  const totalProdutosCategoria = (cat) => {
    if (!cat.idPai) {
      const filhas = categorias.filter((c) => c.idPai === cat.id);
      if (filhas.length > 0)
        return filhas.reduce((soma, c) => soma + (c.totalProdutos ?? 0), 0);
    }
    return cat.totalProdutos ?? 0;
  };

  const handleEdit = (cat) => {
    setEditando({ id: cat.id, nome: cat.nome, idPai: cat.idPai ?? "" });
    setAddMode(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API}/api/categorias/${editando.id}`,
        {
          nome: editando.nome,
          idPai: editando.idPai !== "" ? parseInt(editando.idPai) : null,
        },
        { headers: authHeaders }
      );
      setEditando(null);
      fetchCategorias();
      onCategoriasMudaram?.();
      showMsg("Categoria atualizada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao atualizar categoria.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/api/categorias`,
        {
          nome: novaCategoria.nome,
          idPai: novaCategoria.idPai !== "" ? parseInt(novaCategoria.idPai) : null,
        },
        { headers: authHeaders }
      );
      setNovaCategoria({ nome: "", idPai: "" });
      setAddMode(null);
      fetchCategorias();
      onCategoriasMudaram?.();
      showMsg("Categoria criada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao criar categoria.");
    }
  };

  const handleInativar = async (id) => {
    if (!window.confirm("Tens a certeza que queres inativar esta categoria?")) return;
    try {
      await axios.delete(`${API}/api/categorias/${id}`, { headers: authHeaders });
      if (editando?.id === id) setEditando(null);
      fetchCategorias();
      onCategoriasMudaram?.();
      showMsg("Categoria inativada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao inativar categoria.");
    }
  };

  const handleReativar = async (id) => {
    try {
      await axios.put(`${API}/api/categorias/${id}/reativar`, {}, { headers: authHeaders });
      fetchCategorias();
      onCategoriasMudaram?.();
      showMsg("Categoria reativada com sucesso!");
    } catch (err) {
      const data = err.response?.data;
      showMsg(typeof data === "string" && data ? data : "Erro ao reativar categoria.");
    }
  };

  const abrirAddForm = (modo) => {
    setEditando(null);
    if (addMode === modo) {
      setAddMode(null);
    } else {
      setAddMode(modo);
      setNovaCategoria({ nome: "", idPai: "" });
    }
  };

  const handleSort = (col) => {
    if (sortColumn === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortColumn(col); setSortOrder("asc"); }
  };

  const sortIndicator = (col) => {
    if (sortColumn !== col) return " ↕";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const categoriasSorted = [...categorias].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA, valB;
    if (sortColumn === "id") {
      valA = a.id; valB = b.id;
    } else if (sortColumn === "nome") {
      valA = nomeCategoriaCompleto(a).toLowerCase();
      valB = nomeCategoriaCompleto(b).toLowerCase();
    } else if (sortColumn === "tipo") {
      valA = a.idPai ? 1 : 0;
      valB = b.idPai ? 1 : 0;
    } else if (sortColumn === "totalProdutos") {
      valA = totalProdutosCategoria(a);
      valB = totalProdutosCategoria(b);
    } else if (sortColumn === "estado") {
      valA = a.ativa ? 0 : 1;
      valB = b.ativa ? 0 : 1;
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Só categorias raiz ativas podem ser pai de novas subcategorias
  const categoriasPai = categorias.filter((c) => !c.idPai && c.ativa);

  const formStyle = {
    marginTop: "24px",
    padding: "24px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "16px",
    border: "1px solid var(--glass-border)",
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div className="card card-wide" style={{ maxWidth: "900px" }}>
        <h2>Gestão de Categorias</h2>
        <p className="card-subtitle">Administra as categorias e subcategorias da loja</p>

        {mensagem && <div className="msg msg-info">{mensagem}</div>}

        {/* Formulário de edição */}
        {editando && (
          <form onSubmit={handleUpdate} style={formStyle}>
            <h3>Editar Categoria</h3>

            <div className="input-group">
              <label>Nome</label>
              <input
                className="input-field"
                value={editando.nome}
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Categoria Pai <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(deixar vazio = categoria principal)</span></label>
              <select
                className="input-field"
                value={editando.idPai}
                onChange={(e) => setEditando({ ...editando, idPai: e.target.value })}
              >
                <option value="">— Nenhuma (categoria principal) —</option>
                {categoriasPai
                  .filter((c) => c.id !== editando.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabela de categorias */}
        <div className="table-wrapper" style={{ marginTop: "24px" }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>ID{sortIndicator("id")}</th>
                <th onClick={() => handleSort("nome")} style={{ cursor: "pointer" }}>Nome{sortIndicator("nome")}</th>
                <th onClick={() => handleSort("tipo")} style={{ cursor: "pointer" }}>Tipo{sortIndicator("tipo")}</th>
                <th onClick={() => handleSort("totalProdutos")} style={{ cursor: "pointer" }}>Produtos{sortIndicator("totalProdutos")}</th>
                <th onClick={() => handleSort("estado")} style={{ cursor: "pointer" }}>Estado{sortIndicator("estado")}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriasSorted.map((cat) => (
                <tr key={cat.id} style={{ opacity: cat.ativa ? 1 : 0.5 }}>
                  <td>{cat.id}</td>
                  <td style={{ fontWeight: cat.idPai ? 400 : 600 }}>
                    {nomeCategoriaCompleto(cat)}
                  </td>
                  <td>
                    <span className={`badge ${cat.idPai ? "badge-user" : "badge-admin"}`}>
                      {cat.idPai ? "Subcategoria" : "Principal"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: totalProdutosCategoria(cat) === 0 ? "var(--text-secondary)" : "inherit" }}>
                      {totalProdutosCategoria(cat)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${cat.ativa ? "badge-admin" : "badge-user"}`}>
                      {cat.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {cat.ativa && (
                        <button className="btn btn-edit" onClick={() => handleEdit(cat)}>
                          Editar
                        </button>
                      )}
                      {cat.ativa ? (
                        <button className="btn btn-danger" onClick={() => handleInativar(cat.id)}>
                          Inativar
                        </button>
                      ) : (
                        <button className="btn btn-secondary" onClick={() => handleReativar(cat.id)}>
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Botões de adicionar */}
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => abrirAddForm("principal")}
          >
            {addMode === "principal" ? "✕ Cancelar" : "+ Categoria Principal"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => abrirAddForm("subcategoria")}
          >
            {addMode === "subcategoria" ? "✕ Cancelar" : "+ Subcategoria"}
          </button>
        </div>

        {/* Formulário de criação — Categoria Principal */}
        {addMode === "principal" && (
          <form onSubmit={handleCreate} style={formStyle}>
            <h3>Nova Categoria Principal</h3>
            <div className="input-group">
              <label>Nome</label>
              <input
                className="input-field"
                value={novaCategoria.nome}
                onChange={(e) => setNovaCategoria({ nome: e.target.value, idPai: "" })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "20px" }}>
              Criar Categoria
            </button>
          </form>
        )}

        {/* Formulário de criação — Subcategoria */}
        {addMode === "subcategoria" && (
          <form onSubmit={handleCreate} style={formStyle}>
            <h3>Nova Subcategoria</h3>
            <div className="input-group">
              <label>Categoria Pai</label>
              <select
                className="input-field"
                value={novaCategoria.idPai}
                onChange={(e) => setNovaCategoria({ ...novaCategoria, idPai: e.target.value })}
                required
              >
                <option value="">Selecionar categoria pai...</option>
                {categoriasPai.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Nome da Subcategoria</label>
              <input
                className="input-field"
                value={novaCategoria.nome}
                onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "20px" }}>
              Criar Subcategoria
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
