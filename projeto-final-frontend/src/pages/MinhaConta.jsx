import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function MinhaConta({ setPage }) {
  const [abaAtiva, setAbaAtiva] = useState("perfil");
  const [utilizador, setUtilizador] = useState(null);
  const [loading, setLoading] = useState(true);

  // Campos do perfil
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [cidade, setCidade] = useState("");

  const [msgPerfil, setMsgPerfil] = useState("");
  const [msgSeguranca, setMsgSeguranca] = useState("");
  const [encomendas, setEncomendas] = useState([]);
  const [loadingEncomendas, setLoadingEncomendas] = useState(false);
  const [erroEncomendas, setErroEncomendas] = useState(false);
  const [encomendaAberta, setEncomendaAberta] = useState(null);

  const token = localStorage.getItem("token");
  const isGoogle = localStorage.getItem("authProvider") === "google";

  const formatTelefone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter((p) => p.length > 0).join(" ");
  };

  useEffect(() => {
    axios
      .get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const u = res.data;
        setUtilizador(u);
        setNome(u.nome || "");
        setTelefone(formatTelefone(u.telefone || ""));
        setMorada(u.morada || "");
        setCodigoPostal(u.codigoPostal || "");
        setCidade(u.cidade || "");
      })
      .catch(() => setMsgPerfil("Erro ao carregar dados da conta."))
      .finally(() => setLoading(false));
  }, []);

  const carregarEncomendas = () => {
    setLoadingEncomendas(true);
    setErroEncomendas(false);
    axios
      .get(`${API}/api/encomendas`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setEncomendas(res.data))
      .catch(() => setErroEncomendas(true))
      .finally(() => setLoadingEncomendas(false));
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setMsgPerfil("");
    const digitos = telefone.replace(/\s/g, "");
    if (digitos.length > 0 && digitos.length !== 9) {
      setMsgPerfil("O telefone deve ter exatamente 9 dígitos.");
      return;
    }
    try {
      await axios.put(
        `${API}/api/auth/profile`,
        { nome, telefone: digitos, morada, codigoPostal, cidade },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUtilizador((prev) => ({ ...prev, nome, telefone, morada, codigoPostal, cidade }));
      setMsgPerfil("Perfil atualizado com sucesso.");
    } catch (error) {
      setMsgPerfil(error.response?.data || "Erro ao guardar alterações.");
    }
  };

  const handleToggle2FA = async () => {
    setMsgSeguranca("");
    try {
      const response = await axios.post(
        `${API}/api/auth/toggle-2fa`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUtilizador((prev) => ({ ...prev, twoFactorHabilitado: response.data.habilitado }));
      setMsgSeguranca(
        response.data.habilitado
          ? "Verificação em dois passos ativada."
          : "Verificação em dois passos desativada."
      );
    } catch (error) {
      setMsgSeguranca(error.response?.data || "Erro ao alterar a configuração.");
    }
  };

  if (loading) {
    return (
      <div className="card card-wide">
        <p style={{ color: "var(--text-secondary)" }}>A carregar...</p>
      </div>
    );
  }

  return (
    <div className="card card-wide">
      <h2>Minha Conta</h2>
      <p className="card-subtitle">Gere os teus dados e preferências de segurança</p>

      {/* Navegação das abas */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${abaAtiva === "perfil" ? "ativo" : ""}`}
          onClick={() => setAbaAtiva("perfil")}
        >
          Perfil
        </button>
        <button
          className={`tab-btn ${abaAtiva === "seguranca" ? "ativo" : ""}`}
          onClick={() => setAbaAtiva("seguranca")}
        >
          Segurança
        </button>
        <button
          className={`tab-btn ${abaAtiva === "encomendas" ? "ativo" : ""}`}
          onClick={() => { setAbaAtiva("encomendas"); carregarEncomendas(); }}
        >
          Encomendas
        </button>
      </div>

      {/* Aba: Perfil */}
      {abaAtiva === "perfil" && (
        <form onSubmit={handleGuardarPerfil}>
          <div className="input-group">
            <label>Nome</label>
            <input
              className="input-field"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              className="input-field"
              type="email"
              value={utilizador?.email || ""}
              disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>

          <div className="input-group">
            <label>Telefone</label>
            <input
              className="input-field"
              type="tel"
              placeholder="9XX XXX XXX"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              maxLength={11}
            />
          </div>

          <hr className="section-divider" />

          <div className="input-group">
            <label>Morada</label>
            <input
              className="input-field"
              type="text"
              placeholder="Rua, número, andar..."
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Código Postal</label>
              <input
                className="input-field"
                type="text"
                placeholder="0000-000"
                value={codigoPostal}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
                  const formatted = digits.length > 4
                    ? `${digits.slice(0, 4)}-${digits.slice(4)}`
                    : digits;
                  setCodigoPostal(formatted);
                }}
                maxLength={8}
              />
            </div>
            <div className="input-group">
              <label>Cidade</label>
              <input
                className="input-field"
                type="text"
                placeholder="Lisboa"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Guardar alterações
          </button>

          {msgPerfil && (
            <div className={`msg ${msgPerfil.includes("sucesso") ? "msg-success" : "msg-error"}`}>
              {msgPerfil}
            </div>
          )}
        </form>
      )}

      {/* Aba: Segurança */}
      {abaAtiva === "seguranca" && (
        <div>
          <div className="toggle-row">
            <div className="toggle-info">
              <strong>Verificação em dois passos</strong>
              <p>
                {utilizador?.tipo === "1"
                  ? "Obrigatória para administradores e não pode ser desativada."
                  : "Ao ativar, receberás um código por email sempre que fizeres login."}
              </p>
            </div>
            {isGoogle ? (
              <span style={{ fontSize: "0.83rem", color: "#000", backgroundColor: "#FFC107", whiteSpace: "nowrap", padding: "4px 12px", borderRadius: "6px", fontWeight: "600" }}>
                Conta Google
              </span>
            ) : utilizador?.tipo !== "1" ? (
              <button
                className={`btn ${utilizador?.twoFactorHabilitado ? "btn-logout" : "btn-primary"}`}
                style={{ width: "auto", marginTop: 0, whiteSpace: "nowrap" }}
                onClick={handleToggle2FA}
              >
                {utilizador?.twoFactorHabilitado ? "Desativar" : "Ativar"}
              </button>
            ) : (
              <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                Sempre ativa
              </span>
            )}
          </div>

          {!isGoogle && (
            <>
              <hr className="section-divider" />
              <div className="toggle-row">
                <div className="toggle-info">
                  <strong>Password</strong>
                  <p>Altera a password da tua conta.</p>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ width: "auto", marginTop: 0, whiteSpace: "nowrap" }}
                  onClick={() => setPage("changePassword")}
                >
                  Alterar password
                </button>
              </div>
            </>
          )}

          {msgSeguranca && (
            <div
              className={`msg ${msgSeguranca.includes("Erro") ? "msg-error" : "msg-success"}`}
              style={{ marginTop: "20px" }}
            >
              {msgSeguranca}
            </div>
          )}
        </div>
      )}

      {/* Aba: Encomendas */}
      {abaAtiva === "encomendas" && (
        <div>
          {loadingEncomendas ? (
            <p style={{ color: "var(--text-secondary)" }}>A carregar encomendas...</p>
          ) : erroEncomendas ? (
            <p style={{ color: "rgba(220,53,69,0.9)" }}>Erro ao carregar encomendas. Tenta novamente.</p>
          ) : encomendas.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>Ainda não fizeste nenhuma encomenda.</p>
          ) : (
            <div className="encomendas-lista">
              {encomendas.map((enc) => (
                <div key={enc.id} className="encomenda-card">
                  <div
                    className="encomenda-header"
                    onClick={() => setEncomendaAberta(encomendaAberta === enc.id ? null : enc.id)}
                  >
                    <div className="encomenda-meta">
                      <span className="encomenda-id">Encomenda #{enc.id}</span>
                      <span className="encomenda-data">{enc.dataCriacao}</span>
                    </div>
                    <div className="encomenda-meta" style={{ gap: 12 }}>
                      <span className={`encomenda-estado estado-${enc.estado}`}>{enc.estado}</span>
                      <span className="encomenda-total">{Number(enc.total).toFixed(2)} €</span>
                      <span className="encomenda-seta">{encomendaAberta === enc.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {encomendaAberta === enc.id && (
                    <div className="encomenda-detalhe">
                      <div className="encomenda-entrega">
                        <strong>Entrega:</strong> {enc.moradaEntrega}, {enc.codigoPostal} {enc.cidade}
                        {enc.notas && <p style={{ marginTop: 4, color: "var(--text-secondary)" }}>"{enc.notas}"</p>}
                      </div>
                      <table className="encomenda-tabela">
                        <thead>
                          <tr>
                            <th>Produto</th>
                            <th>Preço unit.</th>
                            <th>Qtd.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enc.items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.nomeProduto}</td>
                              <td>{Number(item.precoUnitario).toFixed(2)} €</td>
                              <td>{item.quantidade}</td>
                              <td>{(item.precoUnitario * item.quantidade).toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
