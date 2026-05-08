import { useState } from "react";
import axios from "axios";

export default function Register({ setPage }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5074/api/auth/register", { nome, email, password, tipo: 0 });
      setMessage(response.data);
      setTimeout(() => setPage("login"), 2000);
    } catch (error) {
      let msg = "Erro no registro";
      if (error.response?.data?.errors) {
        msg = Object.values(error.response.data.errors).flat().join(" ");
      } else if (typeof error.response?.data === "string") {
        msg = error.response.data;
      }
      setMessage(msg);
    }
  };

  return (
    <div className="card">
      <h1>Criar conta</h1>
      <p className="card-subtitle">Preenche os teus dados para começar</p>

      <form onSubmit={handleRegister}>
        <div className="input-group">
          <label>Nome</label>
          <input className="input-field" placeholder="O teu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input className="input-field" type="email" placeholder="o.teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">Criar conta</button>
      </form>

      {message && <div className={`msg ${message.includes("sucesso") || message.includes("Conta criada") ? "msg-success" : "msg-error"}`}>{message}</div>}

      <p style={{ marginTop: "24px", fontSize: "0.88rem", color: "var(--text-secondary)", textAlign: "center" }}>
        Já tens conta?{" "}
        <button className="link-btn" onClick={() => setPage("login")}>Faz login aqui</button>
      </p>
    </div>
  );
}