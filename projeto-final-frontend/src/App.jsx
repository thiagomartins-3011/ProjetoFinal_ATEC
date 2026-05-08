import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Users from "./pages/Users";
import AdminProdutos from "./pages/AdminProdutos";
import AdminCategorias from "./pages/AdminCategorias";
import AdminEncomendas from "./pages/AdminEncomendas";
import AdminMarcas from "./pages/AdminMarcas";
import AdminLogs from "./pages/AdminLogs";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import MinhaConta from "./pages/MinhaConta";
import Catalogo from "./pages/Catalogo";
import Produto from "./pages/Produto";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Chatbot from "./components/Chatbot";
import SobreNos from "./pages/SobreNos";
import Contacto from "./pages/Contacto";

const API = "http://localhost:5074";

function App() {
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem("currentPage");
    if (saved && saved !== "encomendaConcluida") return saved;
    return "catalogo";
  });
  const [userTipo, setUserTipo] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try { return Number(jwtDecode(token).tipo); } catch { return 0; }
    }
    return 0;
  });
  const [loginMessage, setLoginMessage] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [produtoId, setProdutoId] = useState(() => {
    const saved = sessionStorage.getItem("produtoId");
    return saved ? Number(saved) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (page !== "encomendaConcluida") {
      sessionStorage.setItem("currentPage", page);
    }
  }, [page]);

  useEffect(() => {
    if (produtoId !== null) {
      sessionStorage.setItem("produtoId", String(produtoId));
    }
  }, [produtoId]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && localStorage.getItem("token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("authProvider");
          setIsLoggedIn(false);
          setUserTipo(0);
          setCarrinho([]);
          setPage("login");
          setLoginMessage("A tua sessão expirou. Faz login novamente.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    if (window.location.pathname === "/reset-password" && resetToken) {
      setPage("reset");
      return;
    }
    if (window.location.pathname === "/confirm-email" && resetToken) {
      axios.get(`http://localhost:5074/api/auth/confirm-email?token=${resetToken}`)
        .then(() => setLoginMessage("E-mail confirmado com sucesso! Já podes fazer login."))
        .catch(() => setLoginMessage("Link inválido ou já utilizado."))
        .finally(() => {
          window.history.replaceState({}, "", "/");
          setPage("login");
          setTimeout(() => setLoginMessage(""), 3000);
        });
      return;
    }
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserTipo(Number(decoded.tipo));
      } catch {
        setUserTipo(0);
      }
    }
  }, []);

  const fetchCategorias = () => {
    axios.get(`${API}/api/categorias`).then((res) => setCategorias(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleLoginSuccess = (token) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);
    setUserTipo(Number(decoded.tipo));
    setIsLoggedIn(true);
    setPage("catalogo");
  };

  // Quando o utilizador faz login, vai buscar o carrinho da BD e faz merge com o local
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const localItems = carrinhoRef.current;

    axios.get(`${API}/api/carrinho`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const carrinhoDb = res.data;
      const merged = [...carrinhoDb];
      const itemsParaSincronizar = [];

      for (const localItem of localItems) {
        const idx = merged.findIndex((i) => i.produto.id === localItem.produto.id);
        if (idx >= 0) {
          const novaQty = Math.min(
            localItem.produto.stock,
            merged[idx].quantidade + localItem.quantidade
          );
          merged[idx] = { ...merged[idx], quantidade: novaQty };
          itemsParaSincronizar.push({ produtoId: localItem.produto.id, quantidade: novaQty });
        } else {
          merged.push(localItem);
          itemsParaSincronizar.push({ produtoId: localItem.produto.id, quantidade: localItem.quantidade });
        }
      }

      setCarrinho(merged);

      for (const item of itemsParaSincronizar) {
        axios.post(`${API}/api/carrinho`, item, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authProvider");
    setIsLoggedIn(false);
    setPage("catalogo");
    setUserTipo(0);
    setCarrinho([]);
  };

  const [categoriaNavegando, setCategoriaNavegando] = useState(null);
  const [toast, setToast] = useState({ visivel: false, produto: null, stockEsgotado: false, saindo: false });
  const [bumpAtivo, setBumpAtivo] = useState(false);
  const toastTimerRef = useRef(null);
  const toastSaidaRef = useRef(null);

  const fecharToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastSaidaRef.current) clearTimeout(toastSaidaRef.current);
    setToast((prev) => ({ ...prev, saindo: true }));
    toastSaidaRef.current = setTimeout(() => setToast({ visivel: false, produto: null, stockEsgotado: false, saindo: false }), 320);
  };

  const [carrinho, setCarrinho] = useState(() => {
    try {
      const saved = localStorage.getItem("carrinho");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const carrinhoRef = useRef(carrinho);
  useEffect(() => { carrinhoRef.current = carrinho; }, [carrinho]);
  useEffect(() => { localStorage.setItem("carrinho", JSON.stringify(carrinho)); }, [carrinho]);

  const handleAdicionarCarrinho = (produto, quantidade) => {
    const existente = carrinhoRef.current.find((item) => item.produto.id === produto.id);
    const novaQuantidade = existente
      ? Math.min(produto.stock, existente.quantidade + quantidade)
      : quantidade;

    const stockEsgotado = existente && novaQuantidade === existente.quantidade;

    if (!stockEsgotado) {
      setCarrinho((prev) =>
        existente
          ? prev.map((item) =>
              item.produto.id === produto.id
                ? { ...item, quantidade: novaQuantidade }
                : item
            )
          : [...prev, { produto, quantidade: novaQuantidade }]
      );

      const token = localStorage.getItem("token");
      if (token) {
        axios.post(
          `${API}/api/carrinho`,
          { produtoId: produto.id, quantidade: novaQuantidade },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      }

      setBumpAtivo(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setBumpAtivo(true)));
      setTimeout(() => setBumpAtivo(false), 500);
    }

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastSaidaRef.current) clearTimeout(toastSaidaRef.current);
    setToast({ visivel: true, produto, stockEsgotado, saindo: false });
    toastTimerRef.current = setTimeout(fecharToast, 4000);
  };

  const totalItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // Ao clicar numa categoria (no header ou nos cards), decide se vai para
  // subcategorias ou diretamente para produtos
  const handleClickCategoria = (catId) => {
    const temFilhos = categorias.some((c) => c.idPai === catId);
    if (temFilhos) {
      setCategoriaNavegando(catId);
      setCategoriaAtiva(null);
    } else {
      const cat = categorias.find((c) => c.id === catId);
      setCategoriaNavegando(cat?.idPai ?? null);
      setCategoriaAtiva(catId);
    }
    setPage("catalogo");
  };

  // Volta para o início do catálogo
  const resetCatalogo = () => {
    setCategoriaAtiva(null);
    setCategoriaNavegando(null);
    setPage("catalogo");
  };

  // Encontra a categoria raiz (topo) para saber qual botão do header destacar
  const getCategoriaRaiz = (catId) => {
    if (!catId) return null;
    const cat = categorias.find((c) => c.id === catId);
    if (!cat || !cat.idPai) return catId;
    return getCategoriaRaiz(cat.idPai);
  };
  const categoriaRaizAtiva = getCategoriaRaiz(categoriaNavegando ?? categoriaAtiva);

  const showCategoriaNav = page === "catalogo";

  return (
    <div className="app-wrapper">

      {/* Header principal */}
      <header className="app-header">
        <div className="header-main">
          <span className="app-title" onClick={resetCatalogo}>
            ♪ <span className="logo-accent">Sound</span>Store
          </span>
          <div className="nav-buttons">
            {!isLoggedIn && (
              <>
                <button className="btn btn-ghost" onClick={resetCatalogo}>Início</button>
                <button className="btn btn-ghost" onClick={() => setPage("login")}>Login</button>
                <button className="btn btn-primary" style={{ width: "auto", marginTop: 0 }} onClick={() => setPage("register")}>Registar</button>
              </>
            )}

            {isLoggedIn && (
              <>
                <button className="btn btn-ghost" onClick={resetCatalogo}>Início</button>
                <button className="btn btn-ghost" onClick={() => setPage("minhaConta")}>Minha Conta</button>
                {userTipo === 1 && (
                  <>
                    <button className="btn btn-ghost" onClick={() => setPage("users")}>Utilizadores</button>
                    <button className="btn btn-ghost" onClick={() => setPage("adminProdutos")}>Produtos</button>
                    <button className="btn btn-ghost" onClick={() => setPage("adminCategorias")}>Categorias</button>
                    <button className="btn btn-ghost" onClick={() => setPage("adminMarcas")}>Marcas</button>
                    <button className="btn btn-ghost" onClick={() => setPage("adminEncomendas")}>Encomendas</button>
                    <button className="btn btn-ghost" onClick={() => setPage("adminLogs")}>Logs</button>
                  </>
                )}
                <button className="btn btn-logout" onClick={handleLogout}>Sair</button>
              </>
            )}

            <button
              className={`btn-carrinho-header${bumpAtivo ? " carrinho-bump" : ""}`}
              onClick={() => setPage("carrinho")}
              title="Carrinho"
            >
              🛒
              {totalItensCarrinho > 0 && (
                <span className="carrinho-badge">{totalItensCarrinho}</span>
              )}
            </button>

            <button
              className="btn-theme"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "Modo claro" : "Modo escuro"}
            >
              {darkMode ? "☀" : "☽"}
            </button>
          </div>
        </div>

        {/* Barra de categorias (só no catálogo) */}
        {showCategoriaNav && (
          <nav className="categorias-nav">
            <div className="categorias-nav-inner">
              {categorias
                .filter((cat) => !cat.idPai)
                .map((cat) => {
                  const filhos = categorias.filter((c) => c.idPai === cat.id);
                  return (
                    <div key={cat.id} className="nav-categoria-wrapper">
                      <button
                        className={`btn-categoria ${categoriaRaizAtiva === cat.id ? "ativo" : ""}`}
                        onClick={() => handleClickCategoria(cat.id)}
                      >
                        {cat.nome}
                        {filhos.length > 0 && <span className="nav-seta">▾</span>}
                      </button>

                      {filhos.length > 0 && (
                        <div className="nav-dropdown">
                          {filhos.map((sub) => (
                            <button
                              key={sub.id}
                              className={`nav-dropdown-item ${categoriaAtiva === sub.id ? "ativo" : ""}`}
                              onClick={() => handleClickCategoria(sub.id)}
                            >
                              {sub.nome}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </nav>
        )}
      </header>

      {/* Conteúdo */}
      {page === "catalogo" && (
        <Catalogo
          setPage={setPage}
          setProdutoId={setProdutoId}
          categorias={categorias}
          categoriaAtiva={categoriaAtiva}
          setCategoriaAtiva={setCategoriaAtiva}
          categoriaNavegando={categoriaNavegando}
          setCategoriaNavegando={setCategoriaNavegando}
          handleClickCategoria={handleClickCategoria}
          resetCatalogo={resetCatalogo}
          onAdicionarCarrinho={handleAdicionarCarrinho}
        />
      )}
      {page === "produto" && (
        <Produto
          produtoId={produtoId}
          setPage={setPage}
          onAdicionarCarrinho={handleAdicionarCarrinho}
        />
      )}
      {page === "carrinho" && (
        <Carrinho
          carrinho={carrinho}
          setCarrinho={setCarrinho}
          setPage={setPage}
          setProdutoId={setProdutoId}
          isLoggedIn={isLoggedIn}
        />
      )}
      {page === "checkout" && (
        <Checkout
          carrinho={carrinho}
          setCarrinho={setCarrinho}
          setPage={setPage}
        />
      )}
      {page === "encomendaConcluida" && (
        <div className="catalogo-wrapper">
          <div className="carrinho-vazio">
            <span className="carrinho-vazio-icone">✓</span>
            <h2>Encomenda realizada com sucesso!</h2>
            <p>Receberás atualizações sobre a tua encomenda.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => { setPage("minhaConta"); }}>
                Ver as minhas encomendas
              </button>
              <button className="btn btn-ghost" onClick={resetCatalogo}>
                Continuar a comprar
              </button>
            </div>
          </div>
        </div>
      )}
      {page === "login" && <Login setPage={setPage} onLoginSuccess={handleLoginSuccess} loginMessage={loginMessage} setLoginMessage={setLoginMessage} />}
      {page === "register" && <Register setPage={setPage} />}
      {page === "reset" && <ResetPassword setPage={setPage} />}
      {page === "changePassword" && <ChangePassword setPage={setPage} />}
      {page === "minhaConta" && <MinhaConta setPage={setPage} />}
      {page === "users" && (
        userTipo === 1 ? (
          <Users setPage={setPage} />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "adminProdutos" && (
        userTipo === 1 ? (
          <AdminProdutos categorias={categorias} />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "adminCategorias" && (
        userTipo === 1 ? (
          <AdminCategorias onCategoriasMudaram={fetchCategorias} />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "adminMarcas" && (
        userTipo === 1 ? (
          <AdminMarcas />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "adminEncomendas" && (
        userTipo === 1 ? (
          <AdminEncomendas />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "adminLogs" && (
        userTipo === 1 ? (
          <AdminLogs />
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Não tens permissão para ver esta página.</p>
          </div>
        )
      )}
      {page === "sobreNos" && <SobreNos setPage={setPage} />}
      {page === "contacto" && <Contacto />}
      <Chatbot categorias={categorias} handleClickCategoria={handleClickCategoria} />

      <footer className="app-footer">
        <div className="footer-inner">
          <span className="app-title" style={{ fontSize: "1rem", cursor: "pointer" }} onClick={resetCatalogo}>
            ♪ <span className="logo-accent">Sound</span>Store
          </span>
          <div className="footer-links">
            <button className="footer-link" onClick={() => setPage("sobreNos")}>Sobre Nós</button>
            <span className="footer-sep">·</span>
            <button className="footer-link" onClick={() => setPage("contacto")}>Contacto</button>
          </div>
          <span className="footer-copy">© {new Date().getFullYear()} SoundStore</span>
        </div>
      </footer>

      {toast.visivel && (
        <div className={`toast${toast.saindo ? " saindo" : ""}`}>
          <span className="toast-icone">{toast.stockEsgotado ? "⚠" : "✓"}</span>
          <div className="toast-conteudo">
            <span className="toast-titulo">{toast.stockEsgotado ? "Stock máximo atingido" : "Adicionado ao carrinho"}</span>
            <span className="toast-produto">{toast.produto?.nome}</span>
          </div>
          {!toast.stockEsgotado && (
            <button
              className="toast-ver"
              onClick={() => { fecharToast(); setPage("carrinho"); }}
            >
              Ver carrinho
            </button>
          )}
          <button
            className="toast-fechar"
            onClick={fecharToast}
          >✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
