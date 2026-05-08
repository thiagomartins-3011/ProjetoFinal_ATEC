import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

function ImagensSection({ imagens, pendentes, onDeleteExisting, onSetPrincipalExisting, onAddFiles, onRemovePending, onTogglePrincipal }) {
  const totalImagens = imagens.length + pendentes.length;
  return (
    <div style={{ marginTop: "16px" }}>
      <label style={{ fontWeight: 600, display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Imagens
      </label>

      {(imagens.length > 0 || pendentes.length > 0) && (
        <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: "10px", marginBottom: "12px", paddingBottom: "4px" }}>
          {imagens.map((img) => (
            <div
              key={img.id}
              style={{ position: "relative", border: "1px solid var(--glass-border)", borderRadius: "8px", overflow: "hidden", width: "100px" }}
            >
              <img
                src={`${API}${img.url}`}
                alt=""
                style={{ width: "100px", height: "80px", objectFit: "cover", display: "block" }}
              />
              {img.principal && (
                <div style={{ position: "absolute", top: 4, left: 4, background: "var(--primary)", color: "#fff", fontSize: "0.62rem", padding: "1px 5px", borderRadius: "4px" }}>
                  Principal
                </div>
              )}
              <div style={{ display: "flex" }}>
                {!img.principal && totalImagens > 1 && (
                  <button
                    type="button"
                    onClick={() => onSetPrincipalExisting(img.id)}
                    title="Definir como principal"
                    style={{ flex: 1, background: "rgba(30,100,255,0.75)", color: "#fff", border: "none", padding: "3px 0", cursor: "pointer", fontSize: "0.7rem" }}
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteExisting(img.id)}
                  style={{ flex: 1, background: "rgba(220,53,69,0.85)", color: "#fff", border: "none", padding: "3px 0", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {pendentes.map(({ file, principal }, idx) => (
            <div
              key={idx}
              style={{ position: "relative", border: `2px solid ${principal ? "var(--primary)" : "var(--glass-border)"}`, borderRadius: "8px", overflow: "hidden", width: "100px" }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt=""
                style={{ width: "100px", height: "80px", objectFit: "cover", display: "block" }}
              />
              {principal && (
                <div style={{ position: "absolute", top: 4, left: 4, background: "var(--primary)", color: "#fff", fontSize: "0.62rem", padding: "1px 5px", borderRadius: "4px" }}>
                  Principal
                </div>
              )}
              <div style={{ display: "flex" }}>
                {!principal && totalImagens > 1 && (
                  <button
                    type="button"
                    onClick={() => onTogglePrincipal(idx)}
                    title="Definir como principal"
                    style={{ flex: 1, background: "rgba(30,100,255,0.75)", color: "#fff", border: "none", padding: "3px 0", cursor: "pointer", fontSize: "0.7rem" }}
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePending(idx)}
                  style={{ flex: 1, background: "rgba(220,53,69,0.85)", color: "#fff", border: "none", padding: "3px 0", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label
        className="btn btn-secondary"
        style={{ display: "inline-block", cursor: "pointer", width: "auto", marginTop: 0 }}
      >
        + Adicionar Imagem
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { onAddFiles(e.target.files); e.target.value = ""; }}
        />
      </label>
    </div>
  );
}

export default function AdminProdutos({ categorias }) {
  const [produtos, setProdutos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [editingProduto, setEditingProduto] = useState(null);
  const [editImagens, setEditImagens] = useState([]);
  const [editNovasImagens, setEditNovasImagens] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoProduto, setNovoProduto] = useState({ nome: "", descricao: "", preco: "", stock: "", idCategoria: "", ativo: true, idMarca: "", promocao: 0 });
  const [novasImagens, setNovasImagens] = useState([]);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [filtroPromocao, setFiltroPromocao] = useState("todos");
  const [porPagina, setPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const showMsg = (msg) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(""), 3500);
  };

  const fetchProdutos = async () => {
    try {
      const res = await axios.get(`${API}/api/produtos/admin`, { headers: authHeaders });
      setProdutos(res.data);
    } catch {
      showMsg("Erro ao carregar produtos.");
    }
  };

  useEffect(() => { fetchProdutos(); }, []);

  useEffect(() => {
    axios.get(`${API}/api/marcas`).then((res) => setMarcas(res.data)).catch(() => {});
  }, []);

  const handleEdit = async (produto) => {
    try {
      const res = await axios.get(`${API}/api/produtos/${produto.id}`);
      setEditingProduto({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao || "",
        preco: produto.preco,
        stock: produto.stock,
        idCategoria: produto.idCategoria,
        ativo: produto.ativo,
        idMarca: produto.idMarca || "",
        promocao: produto.promocao !== undefined ? Number(produto.promocao) : 0,
      });
      setEditImagens(res.data.imagens || []);
      setEditNovasImagens([]);
      setShowAddForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showMsg("Erro ao carregar dados do produto.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API}/api/produtos/${editingProduto.id}`,
        {
          nome: editingProduto.nome,
          descricao: editingProduto.descricao,
          preco: parseFloat(editingProduto.preco),
          stock: parseInt(editingProduto.stock),
          idCategoria: parseInt(editingProduto.idCategoria),
          ativo: editingProduto.ativo,
          idMarca: editingProduto.idMarca ? parseInt(editingProduto.idMarca) : null,
          promocao: parseInt(editingProduto.promocao) || 0,
        },
        { headers: authHeaders }
      );

      for (const { file, principal } of editNovasImagens) {
        const fd = new FormData();
        fd.append("ficheiro", file);
        await axios.post(
          `${API}/api/produtos/${editingProduto.id}/imagens?principal=${principal}`,
          fd,
          { headers: authHeaders }
        );
      }

      showMsg("Produto atualizado com sucesso!");
      setEditingProduto(null);
      setEditImagens([]);
      setEditNovasImagens([]);
      fetchProdutos();
    } catch (err) {
      showMsg(err.response?.data || "Erro ao atualizar produto.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API}/api/produtos`,
        {
          nome: novoProduto.nome,
          descricao: novoProduto.descricao,
          preco: parseFloat(novoProduto.preco),
          stock: parseInt(novoProduto.stock),
          idCategoria: parseInt(novoProduto.idCategoria),
          ativo: novoProduto.ativo,
          idMarca: novoProduto.idMarca ? parseInt(novoProduto.idMarca) : null,
          promocao: parseInt(novoProduto.promocao) || 0,
        },
        { headers: authHeaders }
      );

      const novoId = res.data.id;

      for (const { file, principal } of novasImagens) {
        const fd = new FormData();
        fd.append("ficheiro", file);
        await axios.post(
          `${API}/api/produtos/${novoId}/imagens?principal=${principal}`,
          fd,
          { headers: authHeaders }
        );
      }

      showMsg("Produto criado com sucesso!");
      setNovoProduto({ nome: "", descricao: "", preco: "", stock: "", idCategoria: "", ativo: true, idMarca: "", promocao: 0 });
      setNovasImagens([]);
      setShowAddForm(false);
      fetchProdutos();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      showMsg(err.response?.data || "Erro ao criar produto.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar este produto e todas as suas imagens?")) return;
    try {
      await axios.delete(`${API}/api/produtos/${id}`, { headers: authHeaders });
      showMsg("Produto eliminado com sucesso!");
      if (editingProduto?.id === id) { setEditingProduto(null); setEditImagens([]); }
      fetchProdutos();
    } catch (err) {
      showMsg(err.response?.data || "Erro ao eliminar produto.");
    }
  };

  const handleSetPrincipalExisting = async (imagemId) => {
    try {
      await axios.put(
        `${API}/api/produtos/${editingProduto.id}/imagens/${imagemId}/principal`,
        {},
        { headers: authHeaders }
      );
      setEditImagens((prev) => prev.map((img) => ({ ...img, principal: img.id === imagemId })));
      setEditNovasImagens((prev) => prev.map((f) => ({ ...f, principal: false })));
    } catch {
      showMsg("Erro ao definir imagem principal.");
    }
  };

  const handleDeleteImagem = async (imagemId) => {
    if (!window.confirm("Eliminar esta imagem?")) return;
    try {
      await axios.delete(`${API}/api/produtos/${editingProduto.id}/imagens/${imagemId}`, { headers: authHeaders });
      setEditImagens((prev) => prev.filter((img) => img.id !== imagemId));
    } catch {
      showMsg("Erro ao eliminar imagem.");
    }
  };

  const adicionarFicheiros = (files, setter, jaTemPrincipal = false) => {
    const arr = Array.from(files);
    setter((prev) => {
      const semPrincipal = !jaTemPrincipal && !prev.some((f) => f.principal);
      return [...prev, ...arr.map((f, i) => ({ file: f, principal: semPrincipal && i === 0 }))];
    });
  };

  const togglePrincipal = (idx, setter) => {
    setter((prev) => prev.map((f, i) => ({ ...f, principal: i === idx })));
  };

  const removePending = (idx, setter) => {
    setter((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some((f) => f.principal)) {
        updated[0] = { ...updated[0], principal: true };
      }
      return updated;
    });
  };

  const handleSetPromocao = async (produto, novoValor) => {
    const val = Math.max(0, Math.min(100, novoValor));
    if (val === (produto.promocao || 0)) return;
    try {
      await axios.put(
        `${API}/api/produtos/${produto.id}`,
        {
          nome: produto.nome,
          descricao: produto.descricao || "",
          preco: parseFloat(produto.preco),
          stock: parseInt(produto.stock),
          idCategoria: parseInt(produto.idCategoria),
          ativo: produto.ativo,
          idMarca: produto.idMarca ? parseInt(produto.idMarca) : null,
          promocao: val,
        },
        { headers: authHeaders }
      );
      setProdutos((prev) => prev.map((p) => p.id === produto.id ? { ...p, promocao: val } : p));
    } catch {
      showMsg("Erro ao atualizar promoção.");
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

  const filtered = produtos.filter((p) => {
    if (filtroEstado === "ativo" && !p.ativo) return false;
    if (filtroEstado === "inativo" && p.ativo) return false;
    if (filtroPromocao === "promocao" && !(p.promocao > 0)) return false;
    if (filtroPromocao === "normal" && p.promocao > 0) return false;
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      p.nome?.toLowerCase().includes(term) ||
      p.nomeCategoria?.toLowerCase().includes(term) ||
      p.id?.toString().includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA = a[sortColumn], valB = b[sortColumn];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  useEffect(() => { setPaginaAtual(1); }, [search, filtroEstado, filtroPromocao, sortColumn, sortOrder, porPagina]);

  const totalPaginas = Math.ceil(sorted.length / porPagina);
  const paginados = sorted.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  const nomeCategoriaCompleto = (idCategoria) => {
    const cat = categorias.find((c) => c.id === idCategoria);
    if (!cat) return "";
    const pai = categorias.find((c) => c.id === cat.idPai);
    return pai ? `${pai.nome} ${cat.nome}` : cat.nome;
  };

  const catPais = categorias.filter((c) => !c.idPai);
  const catFilhos = categorias.filter((c) => c.idPai);

  const renderCatOptions = () =>
    catPais.flatMap((pai) => {
      const filhos = catFilhos.filter((f) => f.idPai === pai.id);
      return [
        <option key={pai.id} value={pai.id} style={{ fontWeight: "bold" }}>{pai.nome}</option>,
        ...filhos.map((f) => <option key={f.id} value={f.id}>{pai.nome} › {f.nome}</option>)
      ];
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
      <div className="card card-wide" style={{ maxWidth: "1200px" }}>
        <h2>Gestão de Produtos</h2>
        <p className="card-subtitle">Administra todos os produtos da loja</p>

        {mensagem && <div className="msg msg-info">{mensagem}</div>}

        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input-field"
            style={{ flex: 1, minWidth: "200px" }}
            placeholder="Pesquisar por nome, categoria ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Mostrar:</span>
            <select
              className="input-field"
              style={{ width: "auto", marginBottom: 0 }}
              value={porPagina}
              onChange={(e) => setPorPagina(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Estado:</span>
            <select
              className="input-field"
              style={{ width: "auto", marginBottom: 0 }}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Promoção:</span>
            <select
              className="input-field"
              style={{ width: "auto", marginBottom: 0 }}
              value={filtroPromocao}
              onChange={(e) => setFiltroPromocao(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="promocao">Em promoção</option>
              <option value="normal">Sem promoção</option>
            </select>
          </div>
        </div>

        {editingProduto && (
          <form onSubmit={handleUpdate} style={formStyle}>
            <h3>Editar Produto</h3>

            <div className="input-group">
              <label>Nome</label>
              <input
                className="input-field"
                value={editingProduto.nome}
                onChange={(e) => setEditingProduto({ ...editingProduto, nome: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Descrição</label>
              <textarea
                className="input-field"
                rows={3}
                value={editingProduto.descricao}
                onChange={(e) => setEditingProduto({ ...editingProduto, descricao: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-group">
                <label>Preço (€)</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduto.preco}
                  onChange={(e) => setEditingProduto({ ...editingProduto, preco: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Stock</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  value={editingProduto.stock}
                  onChange={(e) => setEditingProduto({ ...editingProduto, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-group">
                <label>Categoria</label>
                <select
                  className="input-field"
                  value={editingProduto.idCategoria}
                  onChange={(e) => setEditingProduto({ ...editingProduto, idCategoria: e.target.value })}
                  required
                >
                  <option value="">Selecionar categoria</option>
                  {renderCatOptions()}
                </select>
              </div>
              <div className="input-group">
                <label>Estado</label>
                <select
                  className="input-field"
                  value={editingProduto.ativo ? "1" : "0"}
                  onChange={(e) => setEditingProduto({ ...editingProduto, ativo: e.target.value === "1" })}
                >
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-group">
                <label>Marca</label>
                <select
                  className="input-field"
                  value={editingProduto.idMarca}
                  onChange={(e) => setEditingProduto({ ...editingProduto, idMarca: e.target.value })}
                >
                  <option value="">Sem marca</option>
                  {marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Promoção (%)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  value={editingProduto.promocao}
                  onChange={(e) => setEditingProduto({ ...editingProduto, promocao: e.target.value })}
                  placeholder="0 = sem promoção"
                />
              </div>
            </div>

            <ImagensSection
              imagens={editImagens}
              pendentes={editNovasImagens}
              onDeleteExisting={handleDeleteImagem}
              onSetPrincipalExisting={handleSetPrincipalExisting}
              onAddFiles={(files) => adicionarFicheiros(files, setEditNovasImagens, editImagens.some(img => img.principal))}
              onRemovePending={(idx) => removePending(idx, setEditNovasImagens)}
              onTogglePrincipal={(idx) => {
                togglePrincipal(idx, setEditNovasImagens);
                setEditImagens((prev) => prev.map((img) => ({ ...img, principal: false })));
              }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setEditingProduto(null); setEditImagens([]); setEditNovasImagens([]); }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>ID{sortIndicator("id")}</th>
                <th>Imagem</th>
                <th onClick={() => handleSort("nome")} style={{ cursor: "pointer" }}>Nome{sortIndicator("nome")}</th>
                <th onClick={() => handleSort("nomeCategoria")} style={{ cursor: "pointer" }}>Categoria{sortIndicator("nomeCategoria")}</th>
                <th onClick={() => handleSort("nomeMarca")} style={{ cursor: "pointer" }}>Marca{sortIndicator("nomeMarca")}</th>
                <th onClick={() => handleSort("preco")} style={{ cursor: "pointer" }}>Preço{sortIndicator("preco")}</th>
                <th onClick={() => handleSort("stock")} style={{ cursor: "pointer" }}>Stock{sortIndicator("stock")}</th>
                <th onClick={() => handleSort("ativo")} style={{ cursor: "pointer" }}>Estado{sortIndicator("ativo")}</th>
                <th onClick={() => handleSort("promocao")} style={{ cursor: "pointer", textAlign: "center" }}>Promoção{sortIndicator("promocao")}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((p) => (
                <tr key={p.id} style={{
                  opacity: p.categoriaAtiva === false ? 0.5 : 1,
                  background: p.categoriaAtiva === false ? "rgba(150,150,150,0.08)" : p.stock === 0 ? "rgba(220,53,69,0.08)" : p.stock < 5 ? "rgba(255,165,0,0.08)" : undefined
                }}>
                  <td>{p.id}</td>
                  <td>
                    {p.imagemPrincipal ? (
                      <img
                        src={`${API}${p.imagemPrincipal}`}
                        alt={p.nome}
                        style={{ width: 52, height: 44, objectFit: "cover", borderRadius: "6px", display: "block" }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
                    )}
                  </td>
                  <td>{p.nome}</td>
                  <td>
                    {p.categoriaAtiva === false
                      ? <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Categoria inativa</span>
                      : nomeCategoriaCompleto(p.idCategoria)
                    }
                  </td>
                  <td>{p.nomeMarca || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{Number(p.preco).toFixed(2)} €</td>
                  <td style={{ fontWeight: p.stock === 0 ? 700 : undefined, color: p.stock === 0 ? "rgba(220,53,69,0.9)" : p.stock < 5 ? "rgba(200,120,0,0.9)" : undefined }}>
                    {p.stock}
                  </td>
                  <td>
                    <span className={`badge ${p.ativo ? "badge-admin" : "badge-user"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <input
                        key={`promo_${p.id}_${p.promocao}`}
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={p.promocao || 0}
                        onBlur={(e) => handleSetPromocao(p, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                        style={{
                          width: "54px",
                          textAlign: "center",
                          border: "1px solid var(--gray-border)",
                          borderRadius: "6px",
                          padding: "3px 6px",
                          fontSize: "0.85rem",
                          background: "var(--white)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>%</span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEdit(p)}
                        disabled={p.categoriaAtiva === false}
                        title={p.categoriaAtiva === false ? "Reativa a categoria para poder editar este produto" : undefined}
                        style={p.categoriaAtiva === false ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p style={{ marginTop: "10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {sorted.length === 0 ? "Nenhum produto encontrado" : `A mostrar ${(paginaAtual - 1) * porPagina + 1}–${Math.min(paginaAtual * porPagina, sorted.length)} de ${sorted.length} ${sorted.length === 1 ? "produto" : "produtos"}`}
            {produtos.some(p => p.stock === 0) && (
              <span style={{ marginLeft: "16px", color: "rgba(220,53,69,0.9)", fontWeight: 600 }}>
                ● {produtos.filter(p => p.stock === 0).length} sem stock
              </span>
            )}
            {produtos.some(p => p.stock > 0 && p.stock < 5) && (
              <span style={{ marginLeft: "12px", color: "rgba(200,120,0,0.9)", fontWeight: 600 }}>
                ● {produtos.filter(p => p.stock > 0 && p.stock < 5).length} com stock baixo
              </span>
            )}
            {produtos.some(p => p.promocao > 0) && (
              <span style={{ marginLeft: "12px", color: "#ef4444", fontWeight: 600 }}>
                🏷 {produtos.filter(p => p.promocao > 0).length} em promoção
              </span>
            )}
          </p>
          {totalPaginas > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                style={{ background: "var(--gray-light)", border: "1px solid var(--gray-border)", borderRadius: "8px", minWidth: "34px", height: "34px", padding: "0 10px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)", opacity: paginaAtual === 1 ? 0.4 : 1 }}
              >‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPaginaAtual(p)}
                  style={{ background: p === paginaAtual ? "var(--yellow)" : "var(--gray-light)", color: p === paginaAtual ? "#1a1a1a" : "var(--text-primary)", border: `1px solid ${p === paginaAtual ? "var(--yellow)" : "var(--gray-border)"}`, borderRadius: "8px", minWidth: "34px", height: "34px", padding: "0 10px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}
                >{p}</button>
              ))}
              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                style={{ background: "var(--gray-light)", border: "1px solid var(--gray-border)", borderRadius: "8px", minWidth: "34px", height: "34px", padding: "0 10px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)", opacity: paginaAtual === totalPaginas ? 0.4 : 1 }}
              >›</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: "24px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => { setShowAddForm(!showAddForm); setEditingProduto(null); setEditImagens([]); }}
          >
            {showAddForm ? "✕ Cancelar" : "+ Adicionar Produto"}
          </button>

          {showAddForm && (
            <form onSubmit={handleCreate} style={formStyle}>
              <h3>Novo Produto</h3>

              <div className="input-group">
                <label>Nome</label>
                <input
                  className="input-field"
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Descrição</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={novoProduto.descricao}
                  onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label>Preço (€)</label>
                  <input
                    className="input-field"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoProduto.preco}
                    onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Stock</label>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    value={novoProduto.stock}
                    onChange={(e) => setNovoProduto({ ...novoProduto, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label>Categoria</label>
                  <select
                    className="input-field"
                    value={novoProduto.idCategoria}
                    onChange={(e) => setNovoProduto({ ...novoProduto, idCategoria: e.target.value })}
                    required
                  >
                    <option value="">Selecionar categoria</option>
                    {renderCatOptions()}
                  </select>
                </div>
                <div className="input-group">
                  <label>Estado</label>
                  <select
                    className="input-field"
                    value={novoProduto.ativo ? "1" : "0"}
                    onChange={(e) => setNovoProduto({ ...novoProduto, ativo: e.target.value === "1" })}
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label>Marca</label>
                  <select
                    className="input-field"
                    value={novoProduto.idMarca}
                    onChange={(e) => setNovoProduto({ ...novoProduto, idMarca: e.target.value })}
                  >
                    <option value="">Sem marca</option>
                    {marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Promoção (%)</label>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    max="100"
                    value={novoProduto.promocao}
                    onChange={(e) => setNovoProduto({ ...novoProduto, promocao: e.target.value })}
                    placeholder="0 = sem promoção"
                  />
                </div>
              </div>

              <ImagensSection
                imagens={[]}
                pendentes={novasImagens}
                onDeleteExisting={() => {}}
                onAddFiles={(files) => adicionarFicheiros(files, setNovasImagens)}
                onRemovePending={(idx) => removePending(idx, setNovasImagens)}
                onTogglePrincipal={(idx) => togglePrincipal(idx, setNovasImagens)}
              />

              <button type="submit" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Criar Produto
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
