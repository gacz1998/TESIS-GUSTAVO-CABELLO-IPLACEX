import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegistroCliente = () => {
  const navigate = useNavigate();
  
  const [datos, setDatos] = useState({ 
    nombre: '', 
    rut: '', 
    patente: '', 
    email: '', 
    password: '' 
  });
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (datos.rut.length < 8 || datos.password.length < 4) {
        setError("El RUT o la contraseña son muy cortos.");
        setCargando(false);
        return;
    }

    try {
      // Cambio de URL local a producción en Render
      await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/public/register', datos);
      
      setExito(true);
      setCargando(false);
      
      setTimeout(() => {
          navigate('/login-cliente');
      }, 2000);

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || '❌ Error: No se pudo conectar con el servidor.';
      setError(msg);
      setCargando(false);
    }
  };

  if (exito) {
      return (
          <div style={{ height: '100vh', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', background: '#eafaf1' }}>
              <h1 style={{ color: '#27ae60', fontSize: '3rem' }}>✅</h1>
              <h2 style={{ color: '#27ae60' }}>¡Cuenta Creada!</h2>
              <p>Redirigiendo al inicio de sesión...</p>
          </div>
      );
  }

  return (
    <div className="registro-page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7f6' }}>
      
      <nav style={{ background: 'white', padding: '15px 20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
         <h2 onClick={() => navigate('/')} style={{ margin: 0, cursor: 'pointer', color: '#333' }}>Volver al Inicio</h2>
      </nav>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="registro-card animate-fade-in" style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%' }}>
          
          <h2 style={{ color: '#27ae60', textAlign: 'center', marginBottom: '10px' }}>Crear Cuenta</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            Regístrate para agendar horas y ver tus vehículos.
          </p>

          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <input 
                className="input-field" 
                required 
                placeholder="Nombre Completo" 
                value={datos.nombre}
                onChange={e => setDatos({...datos, nombre: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            
            <input 
                className="input-field" 
                required 
                placeholder="RUT (12345678-K)" 
                value={datos.rut}
                onChange={e => setDatos({...datos, rut: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            
            <input 
                className="input-field" 
                required 
                placeholder="Patente del Vehículo" 
                value={datos.patente}
                onChange={e => setDatos({...datos, patente: e.target.value.toUpperCase()})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            
            <input 
                className="input-field" 
                required 
                type="email" 
                placeholder="Correo Electrónico" 
                value={datos.email}
                onChange={e => setDatos({...datos, email: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            
            <input 
                className="input-field" 
                required 
                type="password" 
                placeholder="Crea tu Contraseña" 
                value={datos.password}
                onChange={e => setDatos({...datos, password: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />

            {error && (
                <div style={{ background: '#ffe6e6', color: '#d63031', padding: '10px', borderRadius: '5px', textAlign: 'center', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                className="btn-solid" 
                style={{ background: '#27ae60', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', opacity: cargando ? 0.7 : 1 }} 
                disabled={cargando}
            >
              {cargando ? 'Registrando...' : 'Finalizar Registro'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#888' }}>
            ¿Ya tienes cuenta? <span onClick={() => navigate('/login-cliente')} style={{ color: '#2980b9', cursor: 'pointer', fontWeight: 'bold' }}>Inicia sesión aquí</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistroCliente;
