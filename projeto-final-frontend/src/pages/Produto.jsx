import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5074";

export default function Produto({ produtoId, setPage, onAdicionarCarrinho }) {
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    setLoading(true);
    setImagemAtiva(0);
    setQuantidade(1);
    axios
      .get(`${API}/api/produtos/${produtoId}`)
      .then((res) => setProduto(res.data))
      .finally(() => setLoading(false));
  }, [produtoId]);

  if (loading) {
    return <p className="catalogo-empty">A carregar produto...</p>;
  }

  if (!produto) {
    return (
      <div className="catalogo-wrapper">
        <p className="catalogo-empty">Produto não encontrado.</p>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => setPage("catalogo")}>
            ← Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  const imagens = produto.imagens || [];
  const imagemPrincipal =
    imagens.find((i) => i.principal) || imagens[0] || null;
  const imagemAtual = imagens[imagemAtiva] || imagemPrincipal;
  const semStock = produto.stock === 0;

  return (
    <div className="catalogo-wrapper">
      <button
        className="produto-voltar"
        onClick={() => setPage("catalogo")}
      >
        ← Voltar ao catálogo
      </button>

      <div className="produto-detalhe">
        {/* Galeria de imagens */}
        <div className="produto-galeria">
          <div className="produto-imagem-principal">
            {imagemAtual ? (
              <img src={`${API}${imagemAtual.url}`} alt={produto.nome} />
            ) : (
              <div className="produto-sem-imagem" style={{ fontSize: "5rem" }}>♪</div>
            )}
          </div>

          {imagens.length > 1 && (
            <div className="produto-thumbnails">
              {imagens.map((img, i) => (
                <button
                  key={img.id}
                  className={`produto-thumb ${i === imagemAtiva ? "ativo" : ""}`}
                  onClick={() => setImagemAtiva(i)}
                >
                  <img src={`${API}${img.url}`} alt={`${produto.nome} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do produto */}
        <div className="produto-detalhes-info">
          <span className="produto-categoria">{produto.nomeCategoria}</span>
          <h1 className="produto-detalhe-nome">{produto.nome}</h1>
          <p className="produto-detalhe-preco">
            {Number(produto.preco).toFixed(2)} <span>€</span>
          </p>

          <div className={`produto-stock-badge ${semStock ? "sem-stock" : ""}`}>
            {semStock ? "Sem stock" : `Em stock (${produto.stock} disponíveis)`}
          </div>

          {produto.descricao && (
            <div className="produto-descricao">
              <h3>Descrição</h3>
              <p>{produto.descricao}</p>
            </div>
          )}

          <div className="produto-acoes">
            {!semStock && (
              <div className="produto-quantidade">
                <button
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  disabled={quantidade <= 1}
                >
                  −
                </button>
                <span>{quantidade}</span>
                <button
                  onClick={() => setQuantidade((q) => Math.min(produto.stock, q + 1))}
                  disabled={quantidade >= produto.stock}
                >
                  +
                </button>
              </div>
            )}

            <button
              className={`btn produto-btn-carrinho ${semStock ? "btn-indisponivel" : "btn-primary"}`}
              onClick={!semStock ? () => onAdicionarCarrinho(produto, quantidade) : undefined}
              disabled={semStock}
            >
              {semStock ? "Indisponível" : "🛒 Adicionar ao carrinho"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
