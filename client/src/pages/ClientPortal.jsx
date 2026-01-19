import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientPortal = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token_cliente'); // Usamos el token del Login
  
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el formulario de reserva
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [reserva, setReserva] = useState({ patente: '', servicio: 'Lavado Full', fecha: '', hora: '' });
  const [horasDisponibles, setHorasDisponibles] = useState([]);

  // --- 1. CARGAR DATOS REALES DEL SERVIDOR ---
  useEffect(() => {
    if (!token) {
      navigate('/login-cliente');
      return;
    }

    const obtenerDatos = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/clients/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCliente(res.data);
        if(res.data.patentes?.length > 0) {
            setReserva(prev => ({...prev, patente: res.data.patentes[0]}));
        }
      } catch (err) {
        console.error("Error de sesión:", err);
        localStorage.removeItem('token_cliente');
        navigate('/login-cliente');
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
    generarBloques();
  }, [token, navigate]);

  const generarBloques = () => {
    const bloques = [];
    for (let i = 9; i < 19; i++) {
        bloques.push(`${i}:00`, `${i}:30`);
    }
    setHorasDisponibles(bloques);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login-cliente');
  };

  const handleReserva = async (e) => {
      e.preventDefault();
      try {
          await axios.post('http://localhost:5000/api/public/booking', {
              ...reserva,
              cliente: cliente.nombre,
              rut: cliente.rut
          });
          alert("✅ Reserva solicitada con éxito");
          setMostrarAgenda(false);
      } catch (e) { alert("Error al reservar"); }
  };

  if (cargando) return <div style={{padding:'50px', textAlign:'center'}}>Cargando perfil...</div>;
  if (!cliente) return null;

  const hoy = new Date();
  const vence = new Date(cliente.fecha_vencimiento);
  const diasRestantes = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
  const esVigente = diasRestantes > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f7', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Hola, {cliente.nombre}</h2>
                <p style={{ color: '#7f8c8d', margin:0 }}>RUT: {cliente.rut}</p>
            </div>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }}>
                Salir
            </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:'20px' }}>
            
            <div style={{ 
              background: esVigente ? '#eafaf1' : '#fdedec', 
              borderLeft: `5px solid ${esVigente ? '#2ecc71' : '#e74c3c'}`,
              borderRadius: '8px', padding: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', color:'#555' }}>ESTADO MEMBRESÍA</h3>
              <div style={{ fontSize: '28px', fontWeight:'bold', color: esVigente ? '#27ae60' : '#c0392b', margin:'10px 0' }}>
                {esVigente ? '✅ ACTIVA' : '❌ VENCIDA'}
              </div>
              <p style={{ margin:0, fontSize: '14px', color:'#666' }}>
                {esVigente ? `Vence en ${diasRestantes} días` : 'Contacta a administración.'}
              </p>
              <p style={{ fontSize: '12px', color:'#888' }}>Fecha: {vence.toLocaleDateString()}</p>
            </div>

            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '20px', borderLeft:'5px solid #3498db' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color:'#555' }}>MIS VEHÍCULOS</h3>
              <div style={{ marginTop:'15px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {cliente.patentes && cliente.patentes.length > 0 ? (
                    cliente.patentes.map(p => (
                        <span key={p} style={{ background:'#2c3e50', color:'white', padding:'5px 10px', borderRadius:'15px', fontSize:'14px', fontWeight:'bold' }}>
                            {p}
                        </span>
                    ))
                ) : (
                    <span style={{color:'#999'}}>Sin vehículos registrados</span>
                )}
              </div>
            </div>
        </div>

        <button 
            onClick={() => setMostrarAgenda(!mostrarAgenda)}
            style={{ width: '100%', marginTop: '30px', padding: '15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize:'16px', fontWeight:'bold' }}
        >
            {mostrarAgenda ? 'Cerrar Formulario' : '📅 Agendar Hora de Lavado / Servicio'}
        </button>

        {mostrarAgenda && (
            <div className="animate-fade-in" style={{ marginTop: '20px', background: '#fff', border:'1px solid #eee', padding: '20px', borderRadius: '10px' }}>
                <h3 style={{marginTop:0}}>Nueva Reserva</h3>
                <form onSubmit={handleReserva} style={{display:'grid', gap:'15px'}}>
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Vehículo:</label>
                        <select 
                            style={{width:'100%', padding:'10px', border:'1px solid #ccc', borderRadius:'5px'}}
                            value={reserva.patente}
                            onChange={e => setReserva({...reserva, patente: e.target.value})}
                        >
                            {cliente.patentes?.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Fecha:</label>
                            <input type="date" required style={{width:'90%', padding:'10px', border:'1px solid #ccc', borderRadius:'5px'}} onChange={e=>setReserva({...reserva, fecha: e.target.value})} />
                        </div>
                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Hora:</label>
                            <select required style={{width:'100%', padding:'10px', border:'1px solid #ccc', borderRadius:'5px'}} onChange={e=>setReserva({...reserva, hora: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {horasDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Servicio:</label>
                        <select style={{width:'100%', padding:'10px', border:'1px solid #ccc', borderRadius:'5px'}} onChange={e=>setReserva({...reserva, servicio: e.target.value})}>
                            <option value="Lavado Full">Lavado Full</option>
                            <option value="Lavado Simple">Lavado Simple</option>
                            <option value="Mecánica">Mecánica</option>
                        </select>
                    </div>

                    <button type="submit" style={{background:'#27ae60', color:'white', border:'none', padding:'12px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Confirmar Reserva</button>
                </form>
            </div>
        )}

      </div>
    </div>
  );
};

export default ClientPortal;