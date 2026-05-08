import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function ResetPassword({ setPage }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) setMessage("Token não fornecido na URL.");
    else setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return setMessage("Preenche todos os campos.");
    if (newPassword !== confirmPassword) return setMessage("As passwords não coincidem.");
    try {
      const response = await axios.post("http://localhost:5074/api/auth/reset-password", { token, novaSenha: newPassword });
      setMessage(response.data || "Password redefinida com sucesso!");
      setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      setMessage(error.response?.data || "Erro ao redefinir a password.");
    }
  };

  return (
    <div className="card">
      <h2>Redefinir Password</h2>
      <p className="card-subtitle">Define uma nova password para a tua conta</p>

      {token ? (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nova password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Confirmar nova password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Redefinir Password</button>
        </form>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>Token inválido ou expirado.</p>
      )}

      {message && <div className={`msg ${message.includes("sucesso") ? "msg-success" : "msg-error"}`}>{message}</div>}
    </div>
  );
}