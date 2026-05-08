import { useState, useEffect, useRef } from "react";

const RESPOSTAS = [
  {
    palavras: ["olá", "ola", "oi", "bom dia", "boa tarde", "boa noite", "hey", "hello"],
    resposta: "Olá! Bem-vindo à SoundStore 🎵 Em que posso ajudar-te hoje?",
  },
  {
    palavras: ["envio", "entrega", "prazo", "demora", "quanto tempo", "expedição"],
    resposta: "As encomendas são processadas em 1-2 dias úteis e entregues em 3-5 dias úteis após confirmação.",
  },
  {
    palavras: ["devolu", "trocar", "troca", "devolver", "reembolso"],
    resposta: "Tens 14 dias após a receção do produto para solicitar uma devolução.",
  },
  {
    palavras: ["pagamento", "pagar", "método", "cartão", "transferência"],
    resposta: "Estamos a preparar a integração com sistemas de pagamento. Brevemente terás mais opções disponíveis!",
  },
  {
    palavras: ["guitarra", "baixo", "bateria", "piano", "teclado", "instrumento", "produto", "catálogo", "catalogo", "acessório", "acessorio"],
    resposta: "Temos guitarras, baixos, baterias, pianos, teclados, acessórios e muito mais. Explora o nosso catálogo!",
  },
  {
    palavras: ["marca", "fender", "yamaha", "ibanez"],
    resposta: "Trabalhamos com marcas como Fender, Yamaha, Ibanez e outras. Podes filtrar por marca no catálogo.",
  },
  {
    palavras: ["registar", "registo", "criar conta", "nova conta"],
    resposta: "Para criar uma conta, clica em 'Registar' no menu. É rápido e gratuito!",
  },
  {
    palavras: ["encomenda", "estado", "acompanhar", "histórico", "historico", "pedido"],
    resposta: "Podes ver o estado das tuas encomendas em 'Minha Conta' → aba 'Encomendas'.",
  },
  {
    palavras: ["password", "palavra-passe", "esqueci", "recuperar", "redefinir"],
    resposta: "Clica em 'Esqueceste a password?' na página de login para a recuperar.",
  },
  {
    palavras: ["stock", "disponível", "disponivel", "esgotado"],
    resposta: "A disponibilidade está indicada em cada produto. Produtos esgotados ficam assinalados no catálogo.",
  },
  {
    palavras: ["contacto", "contactar", "suporte", "ajuda", "email"],
    resposta: "Para suporte podes contactar-nos em suporte@soundstore.pt. Respondemos em 24 horas.",
  },
  {
    palavras: ["preço", "preco", "custo", "quanto custa", "valor", "barato", "caro"],
    resposta: "Os preços estão indicados em cada produto. Podes usar o filtro de preço no catálogo para encontrar produtos no teu orçamento.",
  },
  {
    palavras: ["filtro", "filtrar", "pesquisa", "pesquisar", "procurar", "buscar"],
    resposta: "No catálogo podes pesquisar por nome e filtrar por categoria, marca e faixa de preço.",
  },
  {
    palavras: ["carrinho", "cesto", "adicionar"],
    resposta: "Adiciona produtos ao carrinho clicando em 'Ver detalhes' num produto e depois em 'Adicionar ao carrinho'.",
  },
  {
    palavras: ["destaque", "popular", "recomend", "novidade"],
    resposta: "Na página inicial encontras os nossos produtos em destaque, selecionados especialmente para ti!",
  },
  {
    palavras: ["obrigado", "obrigada", "thanks", "valeu", "brigado"],
    resposta: "De nada! Se precisares de mais alguma coisa, estou aqui. 😊",
  },
];

const FALLBACK = "Não tenho resposta para isso. Para mais ajuda, contacta-nos em suporte@soundstore.pt.";
const MENSAGEM_INICIAL = "Olá! Sou o assistente da SoundStore 🎵 Em que posso ajudar-te hoje?";

function encontrarResposta(texto) {
  const lower = texto.toLowerCase();
  for (const { palavras, resposta } of RESPOSTAS) {
    if (palavras.some((p) => lower.includes(p))) return resposta;
  }
  return FALLBACK;
}

function getEmoji(nome) {
  const n = nome.toLowerCase();
  if (n.includes("guitarra") || n.includes("baixo")) return "🎸";
  if (n.includes("bateria") || n.includes("percussão") || n.includes("percussao")) return "🥁";
  if (n.includes("piano") || n.includes("teclado")) return "🎹";
  if (n.includes("microfone") || n.includes("voz") || n.includes("vocal")) return "🎤";
  if (n.includes("amplificador") || n.includes("amp") || n.includes("som")) return "🔊";
  if (n.includes("vento") || n.includes("trompete") || n.includes("saxofone") || n.includes("flauta")) return "🎺";
  if (n.includes("cordas") || n.includes("violino") || n.includes("violoncelo")) return "🎻";
  return "🎵";
}

export default function Chatbot({ categorias = [], handleClickCategoria }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([{ texto: MENSAGEM_INICIAL, tipo: "bot" }]);
  const [input, setInput] = useState("");
  const [digitando, setDigitando] = useState(false);
  const listaRef = useRef(null);
  const inputRef = useRef(null);

  const categoriasRaiz = categorias.filter((c) => !c.idPai);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensagens, digitando]);

  useEffect(() => {
    if (aberto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [aberto]);

  const enviar = () => {
    const texto = input.trim();
    if (!texto || digitando) return;

    setMensagens((prev) => [...prev, { texto, tipo: "user" }]);
    setInput("");
    setDigitando(true);

    setTimeout(() => {
      setDigitando(false);
      setMensagens((prev) => [...prev, { texto: encontrarResposta(texto), tipo: "bot" }]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") enviar();
  };

  const handleCategoria = (cat) => {
    setMensagens((prev) => [...prev, { texto: `${getEmoji(cat.nome)} ${cat.nome}`, tipo: "user" }]);
    setDigitando(true);

    setTimeout(() => {
      setDigitando(false);
      setMensagens((prev) => [
        ...prev,
        { texto: `A abrir a categoria "${cat.nome}" no catálogo!`, tipo: "bot" },
      ]);
      setTimeout(() => {
        handleClickCategoria(cat.id);
        setAberto(false);
      }, 700);
    }, 700);
  };

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={() => setAberto((prev) => !prev)}
        title="Assistente SoundStore"
      >
        {aberto ? "✕" : "💬"}
      </button>

      {aberto && (
        <div className="chatbot-janela">
          <div className="chatbot-header">
            <span>🎵 Assistente SoundStore</span>
            <button className="chatbot-fechar" onClick={() => setAberto(false)}>✕</button>
          </div>

          <div className="chatbot-mensagens" ref={listaRef}>
            {mensagens.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg-${msg.tipo}`}>
                {msg.texto}
              </div>
            ))}
            {digitando && (
              <div className="chatbot-msg chatbot-msg-bot chatbot-digitando">
                <span /><span /><span />
              </div>
            )}
          </div>

          {categoriasRaiz.length > 0 && (
            <div className="chatbot-chips-area">
              <span className="chatbot-chips-label">Explorar categorias</span>
              <div className="chatbot-chips">
                {categoriasRaiz.map((cat) => (
                  <button
                    key={cat.id}
                    className="chatbot-chip"
                    onClick={() => handleCategoria(cat)}
                    disabled={digitando}
                  >
                    {getEmoji(cat.nome)} {cat.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Escreve uma mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
            />
            <button className="chatbot-enviar" onClick={enviar} disabled={!input.trim() || digitando}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
