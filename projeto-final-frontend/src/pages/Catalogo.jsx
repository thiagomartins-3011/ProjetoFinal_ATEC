import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5074";
const POR_PAGINA = 12;

export default function Catalogo({
  setPage,
  setProdutoId,
  categorias,
  categoriaAtiva,
  setCategoriaAtiva,
  categoriaNavegando,
  setCategoriaNavegando,
  handleClickCategoria,
  resetCatalogo,
  onAdicionarCarrinho,
}) {
  const [produtos, setProdutos] = useState([]);
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [produtosPromocao, setProdutosPromocao] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [marcasSelecionadas, setMarcasSelecionadas] = useState(new Set());
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [paginaHome, setPaginaHome] = useState(1);
  const [paginaCatalogo, setPaginaCatalogo] = useState(1);

  // Carrega todos os produtos uma vez (para pesquisa global)
  useEffect(() => {
    axios.get(`${API}/api/produtos`).then((res) => setTodosProdutos(res.data)).catch(() => {});
  }, []);

  // Carrega produtos em promoção para o carrossel da página inicial
  useEffect(() => {
    axios.get(`${API}/api/produtos?emPromocao=true`).then((res) => setProdutosPromocao(res.data)).catch(() => {});
  }, []);

  // Carrega produtos conforme a categoria selecionada (independente da pesquisa)
  useEffect(() => {
    setLoading(true);
    setMarcasSelecionadas(new Set());
    setPrecoMin("");
    setPrecoMax("");
    setPaginaHome(1);
    setPaginaCatalogo(1);

    let url = `${API}/api/produtos`;
    if (categoriaAtiva) {
      url = `${API}/api/produtos?categoriaId=${categoriaAtiva}`;
    } else if (categoriaNavegando) {
      url = `${API}/api/produtos?categoriaId=${categoriaNavegando}&incluirSubcategorias=true`;
    }

    axios.get(url).then((res) => setProdutos(res.data)).finally(() => setLoading(false));
  }, [categoriaAtiva, categoriaNavegando]);

  // Reset página do catálogo quando filtros ou pesquisa mudam
  useEffect(() => { setPaginaCatalogo(1); }, [pesquisa, marcasSelecionadas, precoMin, precoMax]);

  // Na página inicial sem categoria: pesquisa usa todos os produtos
  // Dentro de uma categoria: pesquisa filtra apenas os produtos dessa categoria
  const baseProdutos = (pesquisa && !categoriaAtiva && !categoriaNavegando) ? todosProdutos : produtos;

  // Marcas disponíveis nos produtos actuais
  const marcasDisponiveis = useMemo(() => {
    const map = new Map();
    baseProdutos.forEach((p) => {
      if (p.idMarca) map.set(Number(p.idMarca), p.nomeMarca);
    });
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [baseProdutos]);

  const toggleMarca = (id) => {
    setMarcasSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const produtosFiltrados = baseProdutos.filter((p) => {
    if (pesquisa && !p.nome.toLowerCase().includes(pesquisa.toLowerCase())) return false;
    if (marcasSelecionadas.size > 0 && !marcasSelecionadas.has(Number(p.idMarca))) return false;
    if (precoMin !== "" && p.preco < Number(precoMin)) return false;
    if (precoMax !== "" && p.preco > Number(precoMax)) return false;
    return true;
  });

  // Paginação — home
  const totalPaginasHome = Math.ceil(produtos.length / POR_PAGINA);
  const produtosHome = produtos.slice((paginaHome - 1) * POR_PAGINA, paginaHome * POR_PAGINA);

  // Paginação — catálogo (categoria / pesquisa)
  const totalPaginasCatalogo = Math.ceil(produtosFiltrados.length / POR_PAGINA);
  const produtosPagina = produtosFiltrados.slice((paginaCatalogo - 1) * POR_PAGINA, paginaCatalogo * POR_PAGINA);

  const subcategorias = categorias.filter((c) => c.idPai === categoriaNavegando);
  const categoriasRaiz = categorias.filter((c) => !c.idPai);
  const nomeCatNavegando = categorias.find((c) => c.id === categoriaNavegando)?.nome;
  const nomeCatAtiva = categorias.find((c) => c.id === categoriaAtiva)?.nome;

  const modoHome = !pesquisa && !categoriaAtiva && !categoriaNavegando;
  const mostrarProdutos = !!pesquisa || !!categoriaAtiva || !!categoriaNavegando;

  const limparFiltros = () => {
    setMarcasSelecionadas(new Set());
    setPrecoMin("");
    setPrecoMax("");
  };

  const temFiltrosAtivos = marcasSelecionadas.size > 0 || precoMin !== "" || precoMax !== "";

  const abrirProduto = (id) => { setProdutoId(id); setPage("produto"); };

  return (
    <div className="catalogo-wrapper">

      {/* ===== PÁGINA INICIAL ===== */}
      {modoHome && (
        <>
          <div className="hero-banner">
            <div className="hero-conteudo">
              <p className="hero-subtitulo">Bem-vindo à</p>
              <h1 className="hero-titulo">♪ <span className="logo-accent">Sound</span>Store</h1>
              <p className="hero-descricao">
                Encontra o instrumento perfeito para ti. Guitarras, pianos, baterias e muito mais.
              </p>
            </div>
          </div>

          {/* Cards de categorias */}
          {categoriasRaiz.length > 0 && (
            <div className="categorias-secao">
              <h2 className="secao-titulo">Explorar categorias</h2>
              <div className="categorias-grid">
                {categoriasRaiz.map((cat) => (
                  <button key={cat.id} className="categoria-card" onClick={() => handleClickCategoria(cat.id)}>
                    <span className="categoria-card-nome">{cat.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Promoções — carrossel */}
          {produtosPromocao.length > 0 && (
            <div className="categorias-secao">
              <h2 className="secao-titulo">🏷️ Promoções</h2>
              <CarrosselDestaque produtos={produtosPromocao} onClickProduto={abrirProduto} onAdicionarCarrinho={onAdicionarCarrinho} />
            </div>
          )}

          {/* Nossos produtos */}
          {produtos.length > 0 && (
            <div className="categorias-secao">
              <h2 className="secao-titulo">Nossos produtos</h2>
              <div className="catalogo-search-global">
                <input
                  className="input-field"
                  type="text"
                  placeholder="🔍  Pesquisar em todos os produtos..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                />
              </div>
              <div className="produtos-grid">
                {produtosHome.map((produto) => (
                  <ProdutoCard key={produto.id} produto={produto} onClick={abrirProduto} onAdicionarCarrinho={onAdicionarCarrinho} />
                ))}
              </div>
              <Paginacao pagina={paginaHome} total={totalPaginasHome} onChange={setPaginaHome} />
            </div>
          )}
        </>
      )}

      {/* ===== VISTA DE PRODUTOS (categoria ou pesquisa) ===== */}
      {mostrarProdutos && (
        <>
          {/* Breadcrumb (só em modo categoria) */}
          {!pesquisa && (
            <nav className="catalogo-breadcrumb">
              <button onClick={resetCatalogo}>Início</button>
              {categoriaNavegando && (
                <>
                  <span>›</span>
                  {categoriaAtiva ? (
                    <button onClick={() => setCategoriaAtiva(null)}>{nomeCatNavegando}</button>
                  ) : (
                    <span>{nomeCatNavegando}</span>
                  )}
                </>
              )}
              {categoriaAtiva && <><span>›</span><span>{nomeCatAtiva}</span></>}
            </nav>
          )}

          {/* Cabeçalho com título e pesquisa */}
          <div className="catalogo-header">
            <h2 className="catalogo-titulo">
              {pesquisa
                ? `Resultados para "${pesquisa}"`
                : categoriaAtiva ? nomeCatAtiva ?? "Produtos"
                : categoriaNavegando ? nomeCatNavegando ?? "Produtos"
                : "Todos os produtos"}
            </h2>
            <input
              className="input-field catalogo-search"
              type="text"
              placeholder="🔍  Pesquisar..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          {/* Subcategorias (só quando em categoria pai sem categoria ativa) */}
          {categoriaNavegando && !categoriaAtiva && subcategorias.length > 0 && (
            <div className="categorias-secao" style={{ marginBottom: 24 }}>
              <div className="categorias-grid">
                {subcategorias.map((cat) => (
                  <button key={cat.id} className="categoria-card" onClick={() => handleClickCategoria(cat.id)}>
                    <span className="categoria-card-nome">{cat.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layout: sidebar + produtos */}
          <div className="catalogo-conteudo">

            {/* Sidebar de filtros */}
            <aside className="catalogo-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-titulo-principal">Filtros</span>
                {temFiltrosAtivos && (
                  <button className="sidebar-limpar" onClick={limparFiltros}>Limpar</button>
                )}
              </div>

              {/* Filtro de preço */}
              <div className="sidebar-secao">
                <h4 className="sidebar-titulo">Preço (€)</h4>
                <div className="sidebar-preco">
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    placeholder="Mín"
                    value={precoMin}
                    onChange={(e) => setPrecoMin(e.target.value)}
                  />
                  <span>–</span>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    placeholder="Máx"
                    value={precoMax}
                    onChange={(e) => setPrecoMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro de marcas */}
              {marcasDisponiveis.length > 0 && (
                <div className="sidebar-secao">
                  <h4 className="sidebar-titulo">Marca</h4>
                  {marcasDisponiveis.map((marca) => (
                    <label key={marca.id} className="sidebar-checkbox">
                      <input
                        type="checkbox"
                        checked={marcasSelecionadas.has(marca.id)}
                        onChange={() => toggleMarca(marca.id)}
                      />
                      <span>{marca.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </aside>

            {/* Grelha de produtos */}
            <div className="catalogo-produtos">
              {loading ? (
                <p className="catalogo-empty">A carregar produtos...</p>
              ) : produtosFiltrados.length === 0 ? (
                <p className="catalogo-empty">Nenhum produto encontrado.</p>
              ) : (
                <>
                  <div className="produtos-grid">
                    {produtosPagina.map((produto) => (
                      <ProdutoCard key={produto.id} produto={produto} onClick={abrirProduto} onAdicionarCarrinho={onAdicionarCarrinho} />
                    ))}
                  </div>
                  <Paginacao pagina={paginaCatalogo} total={totalPaginasCatalogo} onChange={setPaginaCatalogo} />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CarrosselDestaque({ produtos, onClickProduto, onAdicionarCarrinho }) {
  const VISIVEIS = 3;
  const total = produtos.length;

  const clonesFront = produtos.slice(-VISIVEIS);
  const clonesBack = produtos.slice(0, VISIVEIS);
  const extended = [...clonesFront, ...produtos, ...clonesBack];
  const startIdx = clonesFront.length;

  const [realIdx, setRealIdx] = useState(startIdx);
  const [transicao, setTransicao] = useState(true);
  const [pausado, setPausado] = useState(false);

  const avancar = useCallback(() => {
    setTransicao(true);
    setRealIdx((i) => i + 1);
  }, []);

  const recuar = useCallback(() => {
    setTransicao(true);
    setRealIdx((i) => i - 1);
  }, []);

  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    const endIdx = startIdx + total;
    if (realIdx >= endIdx) {
      setTransicao(false);
      setRealIdx(startIdx);
    } else if (realIdx < startIdx) {
      setTransicao(false);
      setRealIdx(endIdx - 1);
    }
  };

  useEffect(() => {
    if (!transicao) {
      requestAnimationFrame(() => requestAnimationFrame(() => setTransicao(true)));
    }
  }, [transicao]);

  useEffect(() => {
    if (total <= VISIVEIS || pausado) return;
    const timer = setInterval(avancar, 4000);
    return () => clearInterval(timer);
  }, [total, pausado, avancar]);

  if (total === 0) return null;

  if (total <= VISIVEIS) {
    return (
      <div className="produtos-grid">
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} onClick={onClickProduto} onAdicionarCarrinho={onAdicionarCarrinho} />
        ))}
      </div>
    );
  }

  const dotIdx = (realIdx - startIdx + total) % total;
  const itemWidthPct = 100 / extended.length;
  const trackWidthPct = (extended.length / VISIVEIS) * 100;

  return (
    <div
      className="carrossel-wrapper"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <button className="carrossel-btn carrossel-prev" onClick={recuar}>‹</button>

      <div className="carrossel-viewport">
        <div
          className="carrossel-track"
          style={{
            width: `${trackWidthPct}%`,
            transform: `translateX(${(-realIdx * itemWidthPct)}%)`,
            transition: transicao ? "transform 0.5s ease" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((produto, i) => (
            <div
              key={i}
              className="carrossel-item"
              style={{ width: `${itemWidthPct}%` }}
            >
              <ProdutoCard produto={produto} onClick={onClickProduto} onAdicionarCarrinho={onAdicionarCarrinho} />
            </div>
          ))}
        </div>
      </div>

      <button className="carrossel-btn carrossel-next" onClick={avancar}>›</button>

      <div className="carrossel-dots">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            className={`carrossel-dot ${i === dotIdx ? "carrossel-dot-ativo" : ""}`}
            onClick={() => { setTransicao(true); setRealIdx(startIdx + i); }}
          />
        ))}
      </div>
    </div>
  );
}

function Paginacao({ pagina, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="paginacao">
      <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}>‹</button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={p === pagina ? "paginacao-ativo" : ""}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(pagina + 1)} disabled={pagina === total}>›</button>
    </div>
  );
}

function ProdutoCard({ produto, onClick, onAdicionarCarrinho }) {
  const esgotado = produto.stock === 0;
  const promocao = Number(produto.promocao) || 0;
  const precoOriginal = Number(produto.preco);
  const precoFinal = promocao > 0 ? +(precoOriginal * (1 - promocao / 100)).toFixed(2) : null;

  return (
    <div className={`produto-card${esgotado ? " produto-esgotado" : ""}`}>
      <div className="produto-imagem">
        {esgotado && <span className="badge-esgotado">Esgotado</span>}
        {promocao > 0 && !esgotado && <span className="badge-promocao">-{promocao}%</span>}
        {produto.imagemPrincipal ? (
          <img src={`http://localhost:5074${produto.imagemPrincipal}`} alt={produto.nome} />
        ) : (
          <div className="produto-sem-imagem">♪</div>
        )}
      </div>
      <div className="produto-info">
        <span className="produto-categoria">
          {produto.nomeMarca ? `${produto.nomeMarca} · ` : ""}{produto.nomeCategoria}
        </span>
        <h3 className="produto-nome">{produto.nome}</h3>
        <div className="produto-preco-wrapper" style={{ marginTop: 10 }}>
          {precoFinal !== null ? (
            <>
              <span className="produto-preco-original">{precoOriginal.toFixed(2)} €</span>
              <span className="produto-preco produto-preco-desconto">{precoFinal.toFixed(2)} €</span>
            </>
          ) : (
            <span className="produto-preco">{precoOriginal.toFixed(2)}</span>
          )}
        </div>
        <div className="produto-btns">
          <button className="produto-btn" onClick={() => onClick(produto.id)}>Ver detalhes</button>
          <button
            className="produto-btn-adicionar"
            disabled={esgotado}
            onClick={() => onAdicionarCarrinho && onAdicionarCarrinho(produto, 1)}
          >
            {esgotado ? "Esgotado" : "+ Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
