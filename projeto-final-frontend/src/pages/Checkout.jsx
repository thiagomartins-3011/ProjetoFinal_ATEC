import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function Checkout({ carrinho, setCarrinho, setPage }) {
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [cidade, setCidade] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [a_enviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");

  const total = carrinho.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );

  // Pré-preencher com os dados do perfil
  useEffect(() => {
    axios
      .get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setMorada(res.data.morada || "");
        setCodigoPostal(res.data.codigoPostal || "");
        setCidade(res.data.cidade || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setErro("");
    setAEnviar(true);

    const body = {
      moradaEntrega: morada,
      codigoPostal,
      cidade,
      notas,
      items: carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      })),
    };

    try {
      await axios.post(`${API}/api/encomendas`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.delete(`${API}/api/carrinho`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      setCarrinho([]);
      setPage("encomendaConcluida");
    } catch (err) {
      setErro(err.response?.data || "Erro ao processar a encomenda. Tenta novamente.");
    } finally {
      setAEnviar(false);
    }
  };

  if (loading) {
    return <p className="catalogo-empty">A carregar dados de entrega...</p>;
  }

  return (
    <div className="catalogo-wrapper">
      <button className="produto-voltar" onClick={() => setPage("carrinho")}>
        ← Voltar ao carrinho
      </button>

      <h2 className="catalogo-titulo" style={{ marginBottom: 24 }}>Finalizar encomenda</h2>

      <form className="checkout-layout" onSubmit={handleConfirmar}>
        {/* Dados de entrega */}
        <div className="checkout-entrega">
          <h3 className="checkout-secao-titulo">Dados de entrega</h3>

          <div className="input-group">
            <label>Morada</label>
            <input
              className="input-field"
              type="text"
              placeholder="Rua, número, andar..."
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              required
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
                required
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
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Notas adicionais <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(opcional)</span></label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Ex: Campainha avariada, deixar na portaria..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Resumo da encomenda */}
        <div className="checkout-resumo">
          <h3 className="carrinho-resumo-titulo">Resumo</h3>

          <div className="carrinho-resumo-linhas">
            {carrinho.map(({ produto, quantidade }) => (
              <div key={produto.id} className="carrinho-resumo-linha">
                <span className="carrinho-resumo-qty">{quantidade}×</span>
                <span className="carrinho-resumo-nome">{produto.nome}</span>
                <span className="carrinho-resumo-preco">{(produto.preco * quantidade).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="carrinho-resumo-total">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>

          {erro && (
            <div className="msg msg-error" style={{ marginTop: 16 }}>{erro}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            disabled={a_enviar}
          >
            {a_enviar ? "A processar..." : "Confirmar encomenda"}
          </button>
        </div>
      </form>
    </div>
  );
}
