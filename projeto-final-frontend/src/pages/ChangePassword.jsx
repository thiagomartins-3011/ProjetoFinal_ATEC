import { useState } from "react";
import axios from "axios";

export default function ChangePassword({ setPage }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword)
      return setMessage("Preenche todos os campos.");
    if (newPassword !== confirmPassword)
      return setMessage("As novas passwords não coincidem.");
    try {
      const response = await axios.post(
        "http://localhost:5074/api/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      setMessage(error.response?.data || "Erro ao alterar a password.");
    }
  };

  return (
    <div className="card">
      <h2>Alterar Password</h2>
      <p className="card-subtitle">Define uma nova password para a tua conta</p>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Password atual</label>
          <input className="input-field" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Nova password</label>
          <input className="input-field" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Confirmar nova password</label>
          <input className="input-field" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">Alterar Password</button>
      </form>

      {message && <div className={`msg ${message.includes("sucesso") ? "msg-success" : "msg-error"}`}>{message}</div>}
    </div>
  );
}