import axios from "axios";

const API = "http://localhost:5074";

export default function Carrinho({ carrinho, setCarrinho, setPage, setProdutoId, isLoggedIn }) {
  const token = localStorage.getItem("token");
  const total = carrinho.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );

  const alterarQuantidade = (produtoId, delta, stock) => {
    const item = carrinho.find((i) => i.produto.id === produtoId);
    if (!item) return;
    const novaQty = Math.min(stock, Math.max(1, item.quantidade + delta));

    setCarrinho((prev) =>
      prev.map((i) =>
        i.produto.id === produtoId ? { ...i, quantidade: novaQty } : i
      )
    );

    if (isLoggedIn && token) {
      axios.post(
        `${API}/api/carrinho`,
        { produtoId, quantidade: novaQty },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    }
  };

  const removerItem = (produtoId) => {
    setCarrinho((prev) => prev.filter((item) => item.produto.id !== produtoId));
    if (isLoggedIn && token) {
      axios.delete(`${API}/api/carrinho/${produtoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  if (carrinho.length === 0) {
    return (
      <div className="catalogo-wrapper">
        <div className="carrinho-vazio">
          <span className="carrinho-vazio-icone">🛒</span>
          <h2>O teu carrinho está vazio</h2>
          <p>Adiciona produtos para os veres aqui.</p>
          <button className="btn btn-primary" style={{ width: "auto", marginTop: 16 }} onClick={() => setPage("catalogo")}>
            Ir às compras
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="catalogo-wrapper">
      <h2 className="catalogo-titulo" style={{ marginBottom: 24 }}>O meu carrinho</h2>

      <div className="carrinho-layout">
        {/* Lista de itens */}
        <div className="carrinho-itens">
          {carrinho.map(({ produto, quantidade }) => {
            const imagemUrl =
              produto.imagemPrincipal ||
              produto.imagens?.find((i) => i.principal)?.url ||
              produto.imagens?.[0]?.url ||
              null;
            return (
            <div key={produto.id} className="carrinho-item">
              <div
                className="carrinho-item-img"
                style={{ cursor: "pointer" }}
                onClick={() => { setProdutoId(produto.id); setPage("produto"); }}
              >
                {imagemUrl ? (
                  <img src={`${API}${imagemUrl}`} alt={produto.nome} />
                ) : (
                  <div className="produto-sem-imagem" style={{ fontSize: "2rem" }}>♪</div>
                )}
              </div>

              <div className="carrinho-item-info">
                <span className="produto-categoria">{produto.nomeCategoria}</span>
                <h3
                  className="carrinho-item-nome"
                  style={{ cursor: "pointer" }}
                  onClick={() => { setProdutoId(produto.id); setPage("produto"); }}
                >{produto.nome}</h3>
                <span className="carrinho-item-preco-unit">{Number(produto.preco).toFixed(2)} € / un.</span>
              </div>

              <div className="carrinho-item-acoes">
                <div className="produto-quantidade">
                  <button
                    onClick={() => alterarQuantidade(produto.id, -1, produto.stock)}
                    disabled={quantidade <= 1}
                  >
                    −
                  </button>
                  <span>{quantidade}</span>
                  <button
                    onClick={() => alterarQuantidade(produto.id, 1, produto.stock)}
                    disabled={quantidade >= produto.stock}
                  >
                    +
                  </button>
                </div>

                <span className="carrinho-item-subtotal">
                  {(produto.preco * quantidade).toFixed(2)} €
                </span>

                <button
                  className="btn btn-danger"
                  onClick={() => removerItem(produto.id)}
                  title="Remover"
                >
                  Remover
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Resumo */}
        <div className="carrinho-resumo">
          <h3 className="carrinho-resumo-titulo">Resumo da encomenda</h3>

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

          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => isLoggedIn ? setPage("checkout") : setPage("login")}
          >
            {isLoggedIn ? "Finalizar encomenda" : "Inicia sessão para continuar"}
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 8, textAlign: "center", justifyContent: "center" }}
            onClick={() => setPage("catalogo")}
          >
            Continuar a comprar
          </button>
        </div>
      </div>
    </div>
  );
}
