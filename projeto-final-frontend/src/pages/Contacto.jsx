import { useState } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function Contacto() {
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await axios.post(`${API}/api/contacto`, form);
      setSucesso(true);
      setForm({ nome: "", email: "", assunto: "", mensagem: "" });
    } catch {
      setErro("Ocorreu um erro ao enviar a mensagem. Tenta novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.4s ease forwards" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--yellow-dark) 0%, var(--yellow) 100%)",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2.4rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>
          Fala connosco
        </h1>
        <p style={{ fontSize: "1rem", color: "#1a1a1a", maxWidth: "500px", margin: "0 auto" }}>
          Tens alguma dúvida ou sugestão? Entra em contacto — respondemos o mais rápido possível.
        </p>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 24px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "40px", alignItems: "start" }}>

        {/* Info de contacto */}
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "var(--black)", marginBottom: "24px" }}>
            Informações de contacto
          </h2>
          {[
            { icone: "📍", titulo: "Morada", texto: "Rua da Música, 42\n1000-001 Lisboa, Portugal" },
            { icone: "📧", titulo: "E-mail", texto: "suporte@soundstore.pt" },
            { icone: "📞", titulo: "Telefone", texto: "+351 210 000 000" },
            { icone: "🕐", titulo: "Horário", texto: "Segunda a Sexta\n9h00 – 18h00" },
          ].map((item) => (
            <div key={item.titulo} style={{ display: "flex", gap: "14px", marginBottom: "24px", alignItems: "flex-start" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "var(--yellow)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
              }}>
                {item.icone}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--black)", fontSize: "0.9rem", marginBottom: "2px" }}>{item.titulo}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", whiteSpace: "pre-line", lineHeight: 1.6 }}>{item.texto}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Formulário */}
        <div style={{
          background: "var(--white)",
          border: "1px solid var(--gray-border)",
          borderRadius: "20px",
          padding: "36px",
          boxShadow: "var(--shadow-md)",
        }}>
          {sucesso ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--black)", marginBottom: "10px" }}>
                Mensagem enviada!
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Recebemos a tua mensagem e responderemos em breve.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "auto", marginTop: "24px" }}
                onClick={() => setSucesso(false)}
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--black)", marginBottom: "24px" }}>
                Enviar mensagem
              </h3>

              <label className="input-label">Nome</label>
              <input
                className="input-field"
                name="nome"
                placeholder="O teu nome"
                value={form.nome}
                onChange={handleChange}
                required
              />

              <label className="input-label">E-mail</label>
              <input
                className="input-field"
                name="email"
                type="email"
                placeholder="o.teu@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label className="input-label">Assunto</label>
              <input
                className="input-field"
                name="assunto"
                placeholder="Assunto da mensagem"
                value={form.assunto}
                onChange={handleChange}
                required
              />

              <label className="input-label">Mensagem</label>
              <textarea
                className="input-field"
                name="mensagem"
                placeholder="Escreve a tua mensagem aqui..."
                value={form.mensagem}
                onChange={handleChange}
                required
                rows={5}
                style={{ resize: "vertical", minHeight: "120px" }}
              />

              {erro && (
                <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "12px" }}>{erro}</p>
              )}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={enviando}
                style={{ marginTop: "4px" }}
              >
                {enviando ? "A enviar..." : "Enviar mensagem"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
