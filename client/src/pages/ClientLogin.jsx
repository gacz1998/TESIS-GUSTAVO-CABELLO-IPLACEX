import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const ClientLogin = () => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/auth/client/login', { 
        rut: rut.trim(), 
        password: password 
      });

      const { token, cliente } = res.data;

      localStorage.setItem('token_cliente', token);
      localStorage.setItem('cliente_rut', cliente.rut);
      localStorage.setItem('cliente_nombre', cliente.nombre);
      
      if (cliente.patentes && cliente.patentes.length > 0) {
        localStorage.setItem('cliente_patente', cliente.patentes[0]);
      } else {
        localStorage.setItem('cliente_patente', 'S/N');
      }

      navigate('/portal-cliente');

    } catch (err) { 
      alert(err.response?.data?.msg || 'Error al conectar con el servidor'); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{color: '#e60000'}}>Acceso Clientes</h2>
        <p>Gestiona tus vehículos y reservas</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div style={{marginBottom: '15px'}}>
            <label style={{display:'block', textAlign:'left', fontWeight:'bold', marginBottom:'5px'}}>RUT:</label>
            <input 
              className="auth-input" 
              placeholder="Ej: 12345678-K" 
              value={rut} 
              onChange={e => setRut(e.target.value)} 
              required 
            />
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display:'block', textAlign:'left', fontWeight:'bold', marginBottom:'5px'}}>Contraseña:</label>
            <input 
              className="auth-input" 
              type="password"
              placeholder="Tu clave de acceso" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-login" style={{backgroundColor: '#e60000'}}>
            Iniciar Sesión
          </button>
        </form>
        
        <div style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
            <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'5px'}}>¿No tienes cuenta?</p>
            <button 
                onClick={() => navigate('/registro-cliente')} 
                style={{background:'none', border:'none', color:'#007bff', cursor:'pointer', textDecoration:'underline', fontWeight:'bold'}}
            >
                Regístrate y paga aquí
            </button>
        </div>

        <button onClick={() => navigate('/')} className="link-back" style={{marginTop:'20px'}}>
          ← Volver a la Página de Inicio
        </button>
      </div>
    </div>
  );
};

export default ClientLogin;
