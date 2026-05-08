import { useState, useEffect } from "react";
import axios from "axios";

export default function Users({ setPage }) {
  const [users, setUsers] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", email: "", password: "", tipo: 0 });
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [searchColumn, setSearchColumn] = useState("todos");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const showMensagem = (msg) => {
    setMensagem(typeof msg === "string" ? msg : "Ocorreu um erro inesperado.");
    setTimeout(() => setMensagem(""), 3000);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5074/api/users", { headers });
      setUsers(response.data);
    } catch (error) {
      showMensagem(error.response?.data || "Erro ao carregar lista de usuários.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5074/api/users", newUser, { headers });
      showMensagem("Utilizador criado com sucesso!");
      setNewUser({ nome: "", email: "", password: "", tipo: 0 });
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      showMensagem(error.response?.data || "Erro ao criar utilizador.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5074/api/users/${editingUser.id_utilizadores}`, editingUser, { headers });
      showMensagem("Utilizador atualizado com sucesso!");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      showMensagem(error.response?.data || "Erro ao atualizar utilizador.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar este utilizador?")) return;
    try {
      await axios.delete(`http://localhost:5074/api/users/${id}`, { headers });
      showMensagem("Utilizador eliminado com sucesso!");
      fetchUsers();
    } catch (error) {
      showMensagem(error.response?.data || "Erro ao eliminar utilizador.");
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };



  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    if (!term) return true;

    if (searchColumn === "todos") {
      return (
        user.id_utilizadores?.toString().includes(term) ||
        user.nome?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        (term === "admin" && user.tipo === 1) ||
        (term === "utilizador" && user.tipo === 0)
      );
    }
    if (searchColumn === "id") return user.id_utilizadores?.toString().includes(term);
    if (searchColumn === "nome") return user.nome?.toLowerCase().includes(term);
    if (searchColumn === "email") return user.email?.toLowerCase().includes(term);
    if (searchColumn === "tipo") return (
      (term === "admin" && user.tipo === 1) ||
      (term === "utilizador" && user.tipo === 0)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn]?.toString().toLowerCase();
    const valB = b[sortColumn]?.toString().toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div className="card card-wide">
        <h2>Gestão de Utilizadores</h2>
        <p className="card-subtitle">Administra todas as contas da plataforma</p>

        {mensagem && <div className="msg msg-info">{mensagem}</div>}

        <div className="search-bar" style={{ marginTop: "20px" }}>
          <select
            className="input-field"
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            style={{ width: "140px", flex: "none" }}
          >
            <option value="todos">Todos</option>
            <option value="id">ID</option>
            <option value="nome">Nome</option>
            <option value="email">Email</option>
            <option value="tipo">Tipo</option>
          </select>
          <input
            className="input-field"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {editingUser && (
          <form onSubmit={handleUpdate} style={{ marginTop: "24px", padding: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
            <h3>Editar Utilizador</h3>
            <div className="input-group">
              <label>Nome</label>
              <input className="input-field" placeholder="Nome" value={editingUser.nome} onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input-field" type="email" placeholder="Email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Tipo</label>
              <select className="input-field" value={editingUser.tipo} onChange={(e) => setEditingUser({ ...editingUser, tipo: Number(e.target.value) })}>
                <option value={0}>Utilizador</option>
                <option value={1}>Admin</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {[["id_utilizadores", "ID"], ["nome", "Nome"], ["email", "Email"], ["tipo", "Tipo"]].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)}>
                    {label}
                    {sortColumn === col ? (sortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                  </th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id_utilizadores}>
                  <td>{user.id_utilizadores}</td>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.tipo === 1 ? "badge-admin" : "badge-user"}`}>
                      {user.tipo === 1 ? "Admin" : "Utilizador"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-edit" onClick={() => { setEditingUser(user); setShowAddForm(false); }}>Editar</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(user.id_utilizadores)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button className="btn btn-secondary" onClick={() => { setShowAddForm(!showAddForm); setEditingUser(null); }}>
            {showAddForm ? "✕ Cancelar" : "+ Adicionar Utilizador"}
          </button>

          {showAddForm && (
            <form onSubmit={handleCreate} style={{ marginTop: "24px", padding: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
              <h3>Novo Utilizador</h3>
              <div className="input-group">
                <label>Nome</label>
                <input className="input-field" placeholder="Nome" value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input-field" type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="input-field" type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Tipo</label>
                <select className="input-field" value={newUser.tipo} onChange={(e) => setNewUser({ ...newUser, tipo: Number(e.target.value) })}>
                  <option value={0}>Utilizador</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Criar Utilizador</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}