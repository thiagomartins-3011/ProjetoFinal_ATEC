import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

export default function Login({ setPage, onLoginSuccess, loginMessage, setLoginMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Estado do segundo passo (2FA)
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [codigo, setCodigo] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5074/api/auth/login", { email, password });
      if (response.data.requires2fa) {
        // Guarda o email e mostra o ecrã do código
        setTwoFactorEmail(email);
        setRequires2fa(true);
        setMessage("");
      } else if (response.data.token) {
        localStorage.setItem("authProvider", "local");
        onLoginSuccess(response.data.token);
      }
    } catch (error) {
      const data = error.response?.data;
      setMessage(typeof data === "string" ? data : data?.mensagem || "Erro no login");
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5074/api/auth/verify-2fa", {
        email: twoFactorEmail,
        codigo,
      });
      if (response.data.token) {
        localStorage.setItem("authProvider", "local");
        onLoginSuccess(response.data.token);
      }
    } catch (error) {
      setMessage(error.response?.data || "Código incorreto ou expirado.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5074/api/auth/forgot-password", { email: resetEmail });
      setResetMessage(response.data);
    } catch (error) {
      setResetMessage(error.response?.data || "Erro ao enviar email.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post("http://localhost:5074/api/auth/google-login", { token: credentialResponse.credential });
      if (response.data.token) {
        localStorage.setItem("authProvider", "google");
        onLoginSuccess(response.data.token);
      }
    } catch {
      setMessage("Erro no login com Google");
    }
  };

  // Ecrã do segundo passo de autenticação
  if (requires2fa) {
    return (
      <div className="card">
        <h2>Verificação em dois passos</h2>
        <p className="card-subtitle">
          Enviámos um código de 6 dígitos para <strong>{twoFactorEmail}</strong>. Insere-o abaixo.
        </p>
        <form onSubmit={handleVerify2FA}>
          <div className="input-group">
            <label>Código de verificação</label>
            <input
              className="input-field"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Verificar</button>
        </form>
        {message && <div className="msg msg-error">{message}</div>}
        <div className="forgot-section">
          <button className="link-btn" onClick={() => { setRequires2fa(false); setMessage(""); setCodigo(""); }}>
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Bem-vindo 👋</h1>
      <p className="card-subtitle">Entra na tua conta para continuar</p>

      {loginMessage && (
        <div
          className={`msg ${loginMessage.includes("sucesso") ? "msg-success" : "msg-error"}`}
          style={{ marginBottom: "16px" }}
          onClick={() => setLoginMessage("")}
        >
          {loginMessage}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label>Email</label>
          <input className="input-field" type="email" placeholder="o.teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">Entrar</button>
      </form>

      {message && <div className="msg msg-error">{message}</div>}

      <div className="forgot-section">
        <button className="link-btn" onClick={() => setForgotPassword(!forgotPassword)}>
          {forgotPassword ? "Cancelar" : "Esqueci a password"}
        </button>
      </div>

      {forgotPassword && (
        <form onSubmit={handleForgotPassword} style={{ marginTop: "16px" }}>
          <div className="input-group">
            <label>Email de recuperação</label>
            <input className="input-field" type="email" placeholder="o.teu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Enviar link de recuperação
          </button>
          {resetMessage && <div className="msg msg-info" style={{ marginTop: "10px" }}>{resetMessage}</div>}
        </form>
      )}

      <div className="divider">ou</div>
      <div className="google-btn-wrapper">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setMessage("Erro no login com Google")} />
      </div>

      <p style={{ marginTop: "24px", fontSize: "0.88rem", color: "var(--text-secondary)", textAlign: "center" }}>
        Não tens conta?{" "}
        <button className="link-btn" onClick={() => setPage("register")}>Regista-te aqui</button>
      </p>
    </div>
  );
}