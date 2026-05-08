import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

const ESTADOS_INTERMEDIOS = ["pendente", "processado", "enviado"];

export default function AdminEncomendas() {
  const [encomendas, setEncomendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encomendaAberta, setEncomendaAberta] = useState(null);
  const [aAlterar, setAAlterar] = useState(null);
  const [confirmando, setConfirmando] = useState(null); // { id, acao: "cancelar" | "entregar" }
  const [aProcessar, setAProcessar] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    axios
      .get(`${API}/api/encomendas/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setEncomendas(res.data))
      .finally(() => setLoading(false));
  }, []);

  const alterarEstado = async (id, novoEstado) => {
    setAAlterar(id);
    try {
      await axios.put(`${API}/api/encomendas/${id}/estado`, JSON.stringify(novoEstado), { headers });
      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === id ? { ...enc, estado: novoEstado } : enc))
      );
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === "string" && msg ? msg : "Erro ao alterar o estado.");
    } finally {
      setAAlterar(null);
    }
  };

  const confirmarAcao = async () => {
    if (!confirmando) return;
    const { id, acao } = confirmando;
    setAProcessar(id);
    try {
      if (acao === "cancelar") {
        await axios.post(`${API}/api/encomendas/${id}/cancelar`, {}, { headers });
        setEncomendas((prev) =>
          prev.map((enc) => (enc.id === id ? { ...enc, estado: "cancelado" } : enc))
        );
      } else {
        await axios.put(`${API}/api/encomendas/${id}/estado`, JSON.stringify("entregue"), { headers });
        setEncomendas((prev) =>
          prev.map((enc) => (enc.id === id ? { ...enc, estado: "entregue" } : enc))
        );
      }
      setConfirmando(null);
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === "string" && msg ? msg : "Erro ao processar a ação.");
    } finally {
      setAProcessar(null);
    }
  };

  if (loading) return <p className="catalogo-empty">A carregar encomendas...</p>;

  return (
    <div className="catalogo-wrapper">
      <h2 className="catalogo-titulo" style={{ marginBottom: 24 }}>
        Gestão de Encomendas
      </h2>

      {encomendas.length === 0 ? (
        <p className="catalogo-empty">Não há encomendas.</p>
      ) : (
        <div className="encomendas-lista">
          {encomendas.map((enc) => {
            const terminal = enc.estado === "cancelado" || enc.estado === "entregue";
            const estaConfirmando = confirmando?.id === enc.id;

            return (
              <div key={enc.id} className="encomenda-card">
                {/* Cabeçalho */}
                <div
                  className="encomenda-header"
                  onClick={() =>
                    setEncomendaAberta(encomendaAberta === enc.id ? null : enc.id)
                  }
                >
                  <div className="encomenda-meta">
                    <span className="encomenda-id">Encomenda #{enc.id}</span>
                    <span className="encomenda-data">{enc.dataCriacao}</span>
                    <span className="encomenda-data" style={{ color: "var(--text-primary)" }}>
                      {enc.nomeUtilizador}
                    </span>
                    <span className="encomenda-data">{enc.emailUtilizador}</span>
                  </div>
                  <div className="encomenda-meta" style={{ gap: 12 }}>
                    <span className={`encomenda-estado estado-${enc.estado}`}>
                      {enc.estado}
                    </span>
                    <span className="encomenda-total">
                      {Number(enc.total).toFixed(2)} €
                    </span>
                    <span className="encomenda-seta">
                      {encomendaAberta === enc.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Detalhe */}
                {encomendaAberta === enc.id && (
                  <div className="encomenda-detalhe">
                    {/* Morada */}
                    <div className="encomenda-entrega">
                      {enc.moradaEntrega && <span>{enc.moradaEntrega}</span>}
                      {enc.codigoPostal && <span> · {enc.codigoPostal}</span>}
                      {enc.cidade && <span> {enc.cidade}</span>}
                      {enc.notas && (
                        <span style={{ display: "block", marginTop: 4 }}>
                          Notas: {enc.notas}
                        </span>
                      )}
                    </div>

                    {/* Itens */}
                    <table className="encomenda-tabela">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Qtd.</th>
                          <th>Preço unit.</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enc.items.map((item, i) => (
                          <tr key={i}>
                            <td>{item.nomeProduto}</td>
                            <td>{item.quantidade}</td>
                            <td>{Number(item.precoUnitario).toFixed(2)} €</td>
                            <td>{(item.quantidade * item.precoUnitario).toFixed(2)} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Rodapé de ações */}
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>

                      {/* Esquerda: botões de estado intermédio ou indicador terminal */}
                      {terminal ? (
                        <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                          {enc.estado === "entregue"
                            ? "Encomenda concluída — não é possível fazer alterações."
                            : "Encomenda cancelada — não é possível fazer alterações."}
                        </span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            Estado:
                          </label>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {ESTADOS_INTERMEDIOS.map((estado) => (
                              <button
                                key={estado}
                                className={`encomenda-estado estado-${estado}`}
                                style={{
                                  cursor: enc.estado === estado ? "default" : "pointer",
                                  opacity: enc.estado === estado ? 1 : 0.45,
                                  border: enc.estado === estado ? "2px solid currentColor" : "2px solid transparent",
                                  background: "transparent",
                                  fontWeight: enc.estado === estado ? 700 : 400,
                                }}
                                disabled={enc.estado === estado || aAlterar === enc.id || estaConfirmando}
                                onClick={() => alterarEstado(enc.id, estado)}
                              >
                                {estado}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direita: confirmação inline ou botões de ação */}
                      {!terminal && (
                        estaConfirmando ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                              {confirmando.acao === "cancelar"
                                ? "Cancelar esta encomenda e devolver o stock?"
                                : "Marcar esta encomenda como entregue?"}
                            </span>
                            <button
                              className={`btn ${confirmando.acao === "cancelar" ? "btn-danger" : "btn-primary"}`}
                              style={{ width: "auto", marginTop: 0, padding: "7px 14px", fontSize: "0.85rem" }}
                              onClick={confirmarAcao}
                              disabled={aProcessar === enc.id}
                            >
                              {aProcessar === enc.id ? "A processar..." : "Confirmar"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ width: "auto", marginTop: 0, padding: "7px 14px", fontSize: "0.85rem" }}
                              onClick={() => setConfirmando(null)}
                            >
                              Voltar atrás
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-primary"
                              style={{ width: "auto", marginTop: 0, padding: "7px 14px", fontSize: "0.85rem" }}
                              onClick={() => setConfirmando({ id: enc.id, acao: "entregar" })}
                            >
                              Marcar como entregue
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ width: "auto", marginTop: 0, padding: "7px 14px", fontSize: "0.85rem" }}
                              onClick={() => setConfirmando({ id: enc.id, acao: "cancelar" })}
                            >
                              Cancelar encomenda
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
