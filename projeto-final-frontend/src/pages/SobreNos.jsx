export default function SobreNos({ setPage }) {
  return (
    <div style={{ width: "100%", animation: "fadeUp 0.4s ease forwards" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--yellow-dark) 0%, var(--yellow) 100%)",
        padding: "72px 24px",
        textAlign: "center",
      }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2.6rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "14px" }}>
          ♪ Sobre a <span style={{ color: "#fff" }}>SoundStore</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#1a1a1a", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
          A tua loja de instrumentos musicais online — para músicos de todos os níveis, desde o primeiro acorde até ao palco.
        </p>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 24px" }}>

        {/* História */}
        <section style={{ marginBottom: "56px", display: "flex", gap: "48px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: "var(--black)", marginBottom: "16px" }}>
              A nossa história
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
              A SoundStore é um projeto de fim de curso desenvolvido por um aluno do curso técnico de programação da ATEC. O objetivo foi criar uma loja online funcional de instrumentos musicais, aplicando os conhecimentos adquiridos ao longo da formação.
            </p>
          </div>
          <div style={{
            flex: "0 0 auto",
            background: "var(--yellow)",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
            minWidth: "200px",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🎸</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#1a1a1a" }}>+500</div>
            <div style={{ fontSize: "0.9rem", color: "#444", fontWeight: 600 }}>Produtos disponíveis</div>
          </div>
        </section>

        {/* Valores */}
        <section style={{ marginBottom: "56px" }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: "var(--black)", marginBottom: "28px", textAlign: "center" }}>
            Os nossos valores
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { icone: "🎯", titulo: "Qualidade", texto: "Só vendemos produtos de marcas reconhecidas e com garantia." },
              { icone: "🚚", titulo: "Entrega rápida", texto: "Encomendas processadas e enviadas em tempo útil para todo o país." },
              { icone: "💬", titulo: "Suporte", texto: "A nossa equipa está disponível para ajudar em qualquer dúvida." },
              { icone: "🎵", titulo: "Paixão", texto: "Somos músicos. Sabemos o que precisas porque também tocamos." },
            ].map((v) => (
              <div key={v.titulo} style={{
                background: "var(--white)",
                border: "1px solid var(--gray-border)",
                borderRadius: "16px",
                padding: "28px 24px",
                boxShadow: "var(--shadow-sm)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{v.icone}</div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--black)", marginBottom: "8px" }}>{v.titulo}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", background: "var(--white)", border: "1px solid var(--gray-border)", borderRadius: "20px", padding: "48px 32px", boxShadow: "var(--shadow-md)" }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--black)", marginBottom: "12px" }}>
            Pronto para começar?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            Explora o nosso catálogo e encontra o instrumento perfeito para ti.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: 0 }}
              onClick={() => setPage("catalogo")}
            >
              Ver catálogo
            </button>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 0 }}
              onClick={() => setPage("contacto")}
            >
              Falar connosco
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
