import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:5074";

const NIVEL_CONFIG = {
  ERR: { label: "ERRO",    cor: "#ef4444", bg: "rgba(239,68,68,0.08)"    },
  FTL: { label: "FATAL",   cor: "#b91c1c", bg: "rgba(185,28,28,0.12)"    },
  WRN: { label: "AVISO",   cor: "#f59e0b", bg: "rgba(245,158,11,0.08)"   },
  INF: { label: "INFO",    cor: "var(--text-secondary)", bg: "transparent" },
  DBG: { label: "DEBUG",   cor: "var(--text-secondary)", bg: "transparent" },
};

function parseLinha(linha) {
  // Formato: [2026-04-29 14:32:55 ERR] Mensagem...
  // trim() remove o \r que o Windows deixa no fim de cada linha
  const match = linha.trim().match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([A-Z]{3})\] (.*)$/);
  if (match) {
    return { timestamp: match[1], nivel: match[2], mensagem: match[3], raw: linha };
  }
  return { timestamp: null, nivel: null, mensagem: linha.trim(), raw: linha };
}

export default function AdminLogs() {
  const [linhas, setLinhas] = useState([]);
  const [ficheiro, setFicheiro] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [quantidade, setQuantidade] = useState(300);
  const [autoScroll, setAutoScroll] = useState(true);
  const listaRef = useRef(null);
  const token = localStorage.getItem("token");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/logs?linhas=${quantidade}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLinhas(res.data.logs || []);
      setFicheiro(res.data.ficheiro);
      setTotal(res.data.total || 0);
    } catch {
      setLinhas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [quantidade]);

  useEffect(() => {
    if (autoScroll && listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [linhas, autoScroll]);

  const parsed = linhas.map(parseLinha);

  const filtrados = parsed.filter((l) => {
    if (filtroNivel === "todos") return true;
    if (filtroNivel === "erros") return l.nivel === "ERR" || l.nivel === "FTL";
    if (filtroNivel === "avisos") return l.nivel === "WRN";
    if (filtroNivel === "info") return l.nivel === "INF";
    return true;
  });

  const contagens = {
    erros: parsed.filter((l) => l.nivel === "ERR" || l.nivel === "FTL").length,
    avisos: parsed.filter((l) => l.nivel === "WRN").length,
    info: parsed.filter((l) => l.nivel === "INF").length,
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div className="card card-wide" style={{ maxWidth: "1200px" }}>
        <h2>Logs do Sistema</h2>
        <p className="card-subtitle">Registo de eventos e erros da aplicação</p>

        {/* Estatísticas */}
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
          <div style={statStyle("#ef4444")}>
            <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{contagens.erros}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Erros</span>
          </div>
          <div style={statStyle("#f59e0b")}>
            <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{contagens.avisos}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Avisos</span>
          </div>
          <div style={statStyle("var(--text-secondary)")}>
            <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{contagens.info}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Info</span>
          </div>
          {ficheiro && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              📄 {ficheiro}
              {total > quantidade && (
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  (a mostrar últimas {quantidade} de {total})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Controlos */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="input-field"
            style={{ width: "auto", marginBottom: 0 }}
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
          >
            <option value="todos">Todos os níveis</option>
            <option value="erros">Só Erros</option>
            <option value="avisos">Só Avisos</option>
            <option value="info">Só Info</option>
          </select>

          <select
            className="input-field"
            style={{ width: "auto", marginBottom: 0 }}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          >
            <option value={100}>Últimas 100 linhas</option>
            <option value={300}>Últimas 300 linhas</option>
            <option value={500}>Últimas 500 linhas</option>
            <option value={1000}>Últimas 1000 linhas</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ accentColor: "var(--primary)", width: "14px", height: "14px" }}
            />
            Auto-scroll
          </label>

          <button
            className="btn btn-primary"
            style={{ width: "auto", marginTop: 0, marginLeft: "auto" }}
            onClick={fetchLogs}
            disabled={loading}
          >
            {loading ? "A carregar..." : "↻ Atualizar"}
          </button>
        </div>

        {/* Lista de logs */}
        <div
          ref={listaRef}
          style={{
            marginTop: "16px",
            background: "var(--gray-light)",
            border: "1px solid var(--gray-border)",
            borderRadius: "10px",
            height: "520px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            padding: "8px 0",
          }}
        >
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>A carregar logs...</p>
          ) : filtrados.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              {linhas.length === 0 ? "Nenhum log encontrado. O ficheiro será criado quando a aplicação registar o primeiro evento." : "Nenhuma linha corresponde ao filtro selecionado."}
            </p>
          ) : (
            filtrados.map((linha, i) => {
              const cfg = NIVEL_CONFIG[linha.nivel] ?? NIVEL_CONFIG.INF;
              const isErro = linha.nivel === "ERR" || linha.nivel === "FTL";
              return (
                <div
                  key={i}
                  style={{
                    padding: "3px 12px",
                    background: cfg.bg,
                    borderLeft: isErro ? `3px solid ${cfg.cor}` : "3px solid transparent",
                    lineHeight: 1.5,
                    wordBreak: "break-all",
                  }}
                >
                  {linha.timestamp && (
                    <span style={{ color: "var(--text-secondary)", marginRight: "8px" }}>
                      {linha.timestamp}
                    </span>
                  )}
                  {linha.nivel && (
                    <span style={{
                      color: cfg.cor,
                      fontWeight: 700,
                      marginRight: "8px",
                      minWidth: "30px",
                      display: "inline-block",
                    }}>
                      {linha.nivel}
                    </span>
                  )}
                  <span style={{ color: isErro ? cfg.cor : "var(--text-primary)" }}>
                    {linha.mensagem}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <p style={{ marginTop: "8px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          A mostrar {filtrados.length} {filtrados.length === 1 ? "linha" : "linhas"}
          {filtroNivel !== "todos" && ` (filtro: ${filtroNivel})`}
        </p>
      </div>
    </div>
  );
}

function statStyle(cor) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "10px 20px",
    background: "var(--gray-light)",
    border: "1px solid var(--gray-border)",
    borderRadius: "10px",
    color: cor,
    minWidth: "80px",
  };
}
