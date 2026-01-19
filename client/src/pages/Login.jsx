import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) { alert('Credenciales incorrectas'); }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Acceso Personal</h2>
        <p>Sistema Multiservicios J y S</p>
        <form onSubmit={handleLogin} className="auth-form">
          <input className="auth-input" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="auth-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn-login">Ingresar</button>
        </form>

        {/* BOTÓN VOLVER */}
        <button onClick={() => navigate('/')} className="link-back">
          ← Volver a la Página de Inicio
        </button>
      </div>
    </div>
  );
};
export default Login;