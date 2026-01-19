import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css'; 

const Home = () => {
  const navigate = useNavigate();
  
  const [registro, setRegistro] = useState({ nombre: '', rut: '', patente: '', email: '', password: '', telefono: '' });
  const [reserva, setReserva] = useState({ cliente: '', telefono: '', patente: '', servicio: 'Lavado Full', fecha: '', hora: '' });
  const [contacto, setContacto] = useState({ nombre: '', email: '', mensaje: '' });
  
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);

  const [msgRegistro, setMsgRegistro] = useState('');
  const [msgReserva, setMsgReserva] = useState('');
  const [msgContacto, setMsgContacto] = useState('');

  const validarRut = (rut) => {
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
    if (cleanRut.length < 8) return false;
    const cuerpo = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    let suma = 0; let multiplo = 2;
    for (let i = 1; i <= cuerpo.length; i++) {
      suma = suma + multiplo * cuerpo.charAt(cuerpo.length - i);
      if (multiplo < 7) multiplo = multiplo + 1; else multiplo = 2;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvFinal = (dvEsperado === 11) ? "0" : (dvEsperado === 10) ? "K" : dvEsperado.toString();
    return dvFinal === dv;
  };

  const obtenerFechaMinima = () => {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0'); 
    const anio = ahora.getFullYear();
    return `${anio}-${mes}-${dia}`;
  };

  const generarBloques = () => {
    const bloques = [];
    for (let i = 9; i < 20; i++) {
      bloques.push(`${i.toString().padStart(2, '0')}:00`);
      if(i < 19) bloques.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return bloques;
  };

  useEffect(() => {
    if (reserva.fecha) { calcularDisponibilidad(reserva.fecha); }
  }, [reserva.fecha]);

  const calcularDisponibilidad = async (fechaSeleccionada) => {
    setCargandoHoras(true);
    setReserva(prev => ({ ...prev, hora: '' })); 
    
    try {
      const res = await axios.get(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/public/availability?fecha=${fechaSeleccionada}`);
      const horasOcupadasBD = res.data; 

      const ahora = new Date();
      const [year, month, day] = fechaSeleccionada.split('-').map(Number);
      const fechaInput = new Date(year, month - 1, day); 
      
      const esHoy = fechaInput.toDateString() === ahora.toDateString();

      const todosLosBloques = generarBloques();
      const horasFinales = todosLosBloques.filter(horaBloque => {
        if (horasOcupadasBD.includes(horaBloque)) return false;
        
        if (esHoy) {
          const [h, m] = horaBloque.split(':').map(Number);
          const horaBloqueDate = new Date();
          horaBloqueDate.setHours(h, m, 0, 0);
          if (horaBloqueDate <= nowWithMargin(30)) return false;
        }
        return true; 
      });

      setHorasDisponibles(horasFinales);
    } catch (e) { 
        console.error("Error cargando horas", e);
        setHorasDisponibles([]); 
    } finally { 
        setCargandoHoras(false); 
    }
  };

  const nowWithMargin = (minutes) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() + minutes);
      return d;
  }

  const seleccionarServicio = (nombreServicio) => {
    setReserva({ ...reserva, servicio: nombreServicio });
    const form = document.getElementById('agenda-form');
    if(form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReserva = async (e) => {
    e.preventDefault();
    setMsgReserva('');
    
    try {
      const res = await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/public/booking', reserva);
      alert(res.data.msg || 'Reserva creada con éxito');
      setMsgReserva('Reserva confirmada. Te esperamos.');
      setReserva({ cliente: '', telefono: '', patente: '', servicio: 'Lavado Full', fecha: '', hora: '' });
      if(reserva.fecha) calcularDisponibilidad(reserva.fecha);
    } catch (err) { 
        console.error(err);
        setMsgReserva('Error al agendar. Intenta otra hora.'); 
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!validarRut(registro.rut)) {
      setMsgRegistro('RUT inválido. Ej: 12345678-K');
      return;
    }
    setCargandoPago(true);
    setMsgRegistro('Procesando registro...');

    try {
      await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/public/register', registro);
      
      setTimeout(() => {
        alert(`Registro Exitoso!\n\nRedirigiendo a Webpay para pago de $50.000\nTitular: ${registro.nombre}`);
        setMsgRegistro('Redirigiendo a pago...');
        window.location.href = "https://www.transbank.cl"; 
      }, 1500);

    } catch (err) { 
      console.error(err);
      setMsgRegistro(err.response?.data?.msg || 'Error al registrar. El RUT podría ya existir.'); 
      setCargandoPago(false);
    }
  };

  const handleContacto = (e) => {
    e.preventDefault();
    setMsgContacto('Mensaje enviado correctamente. Te contactaremos pronto.');
    setContacto({ nombre: '', email: '', mensaje: '' });
  };

  return (
    <div className="home-container">
      
      <nav className="navbar animate-fade-in">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 onClick={() => navigate('/')} style={{cursor:'pointer'}}>Multiservicios J y S</h2>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/registro-cliente')} className="btn-solid">Registrarse</button>
          <button onClick={() => navigate('/login-cliente')} className="btn-solid" style={{backgroundColor: '#007bff'}}>Mi Cuenta</button>
          <button onClick={() => navigate('/login-admin')} className="btn-outline">Personal</button>
        </div>
      </nav>

      <header className="hero animate-bg">
        <div className="animate-fade-in delay-1">
          <h1 className="animate-float">Tu vehículo en las mejores manos</h1>
          <p>Estacionamiento Seguro • Mecánica Integral • Lavado Premium</p>
          <div className="hero-buttons">
            <button onClick={() => seleccionarServicio('Lavado Full')} className="btn-cta">Agendar Lavado</button>
          </div>
        </div>
      </header>

      <section className="pricing-section">
        <h2 className="animate-fade-in delay-2">Nuestras Tarifas</h2>
        <div className="pricing-grid">
          
          <div className="pricing-card">
            <h3>Estacionamiento</h3>
            <div className="price">$20 <span>/ min</span></div>
            <ul className="pricing-features">
              <li>Ubicación Segura</li>
              <li>Primeros 30 min: $2.000</li>
            </ul>
          </div>
          
          <div className="pricing-card featured">
            <div className="badge-popular">POPULAR</div>
            <h3>Lavado Full</h3>
            <div className="price">$25.000</div>
            <ul className="pricing-features">
              <li>Lavado Exterior + Encerado</li>
              <li>Aspirado Profundo</li>
            </ul>
            <button onClick={() => seleccionarServicio('Lavado Full')} className="btn-solid" style={{width: '100%', marginTop: '15px'}}>Agendar Ahora</button>
          </div>
          
          <div className="pricing-card">
            <h3>Membresía Mensual</h3>
            <div className="price">$50.000</div>
            <ul className="pricing-features">
              <li>Estacionamiento Ilimitado</li>
              <li>Cupo Garantizado</li>
            </ul>
            <button onClick={() => navigate('/registro-cliente')} className="btn-outline" style={{width: '100%', marginTop: '15px'}}>Contratar</button>
          </div>

        </div>
      </section>

      <div id="agenda-form" style={{ background: '#eafaf1', padding: '60px 20px', textAlign: 'center', borderTop: '1px solid #27ae60', borderBottom: '1px solid #27ae60' }}>
        <h2 style={{ color: '#27ae60', fontWeight: '800' }}>Reserva tu Hora Online</h2>
        <p style={{marginBottom:'20px'}}>Reserva sin necesidad de registrarte.</p>
        
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleReserva} className="input-group">
            
            <label style={{textAlign:'left', fontWeight:'bold', display:'block', marginBottom:'5px'}}>1. Elige tu Servicio:</label>
            <select className="input-field" value={reserva.servicio} onChange={e => setReserva({...reserva, servicio: e.target.value})}>
              <option value="Lavado Full">Lavado Full ($25.000)</option>
              <option value="Lavado Simple">Lavado Simple ($10.000)</option>
              <option value="Mecánica">Revisión Mecánica</option>
              <option value="Aspirado">Aspirado ($5.000)</option>
            </select>

            <label style={{textAlign:'left', fontWeight:'bold', display:'block', marginBottom:'5px', marginTop:'10px'}}>2. Elige Fecha y Hora:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="date" className="input-field" required min={obtenerFechaMinima()} value={reserva.fecha} onChange={(e) => setReserva({ ...reserva, fecha: e.target.value })} />
              
              <select className="input-field" required value={reserva.hora} onChange={e => setReserva({...reserva, hora: e.target.value})} disabled={!reserva.fecha || cargandoHoras}>
                <option value="">{cargandoHoras ? 'Cargando...' : 'Hora...'}</option>
                {horasDisponibles.map(h => <option key={h} value={h}>{h} hrs</option>)}
              </select>
            </div>
            {horasDisponibles.length === 0 && reserva.fecha && !cargandoHoras && <small style={{color:'red'}}>No hay horas disponibles para esta fecha.</small>}

            <label style={{textAlign:'left', fontWeight:'bold', display:'block', marginBottom:'5px', marginTop:'10px'}}>3. Tus Datos:</label>
            <input className="input-field" required placeholder="Patente (AA-BB-11)" value={reserva.patente} onChange={e => setReserva({...reserva, patente: e.target.value.toUpperCase()})} />
            <input className="input-field" required placeholder="Tu Nombre" value={reserva.cliente} onChange={e => setReserva({...reserva, cliente: e.target.value})} />
            <input className="input-field" placeholder="Teléfono (Opcional)" value={reserva.telefono} onChange={e => setReserva({...reserva, telefono: e.target.value})} />
            
            <button type="submit" className="btn-solid" style={{width:'100%', marginTop:'20px'}}>CONFIRMAR RESERVA</button>
            
            {msgReserva && <div style={{marginTop: '15px', padding:'10px', background:'#d5f5e3', color:'#27ae60', borderRadius:'5px', fontWeight:'bold'}}>{msgReserva}</div>}
          </form>
        </div>
      </div>

      <div className="forms-container">
        
        <div className="form-box registro" id="registro">
          <h2>Membresía Mensual</h2>
          <p style={{fontSize:'0.9rem', marginBottom:'15px'}}>Regístrate para tener acceso ilimitado al estacionamiento.</p>
          
          <form onSubmit={handleRegistro} className="input-group">
            <input className="input-field" required placeholder="Nombre Completo" value={registro.nombre} onChange={e=>setRegistro({...registro, nombre:e.target.value})} />
            <input className="input-field" required placeholder="RUT (12345678-K)" value={registro.rut} onChange={e=>setRegistro({...registro, rut:e.target.value})} />
            <input className="input-field" required placeholder="Patente Principal" value={registro.patente} onChange={e=>setRegistro({...registro, patente:e.target.value.toUpperCase()})} />
            <input className="input-field" required type="email" placeholder="Correo Electrónico" value={registro.email} onChange={e=>setRegistro({...registro, email:e.target.value})} />
            <input className="input-field" required type="password" placeholder="Contraseña para entrar" value={registro.password} onChange={e=>setRegistro({...registro, password:e.target.value})} />
            
            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign:'center', border:'1px solid #ddd' }}>
                <p style={{ margin: 0 }}>Total a Pagar: <strong>$50.000</strong></p>
            </div>
            
            <button type="submit" className="btn-cta" style={{width: '100%', backgroundColor: cargandoPago ? '#ccc' : '#e60000'}} disabled={cargandoPago}>
              {cargandoPago ? 'Procesando...' : 'Pagar con Webpay'}
            </button>
            {msgRegistro && <p style={{marginTop: '10px', fontWeight: 'bold', textAlign:'center'}}>{msgRegistro}</p>}
          </form>
        </div>

        <div className="form-box contacto">
          <h2>Contáctanos</h2>
          <p style={{fontSize:'0.9rem', marginBottom:'15px'}}>¿Dudas sobre nuestros servicios?</p>
          <form onSubmit={handleContacto} className="input-group">
            <input className="input-field" required placeholder="Tu Nombre" value={contacto.nombre} onChange={e=>setContacto({...contacto, nombre:e.target.value})} />
            <input className="input-field" required type="email" placeholder="Tu Email" value={contacto.email} onChange={e=>setContacto({...contacto, email:e.target.value})} />
            <textarea className="input-field" required placeholder="Escribe tu mensaje..." rows="4" value={contacto.mensaje} onChange={e=>setContacto({...contacto, mensaje:e.target.value})}></textarea>
            <button type="submit" className="btn-solid" style={{width: '100%'}}>Enviar Mensaje</button>
            {msgContacto && <p style={{marginTop: '10px', color:'green', fontWeight:'bold', textAlign:'center'}}>{msgContacto}</p>}
          </form>
        </div>

      </div>

      <footer>
        <div className="footer-content">
          <div className="footer-col">
            <h4>Multiservicios J y S</h4>
            <p>Rancagua, Región de O'Higgins.</p>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <p>+56 9 1234 5678</p>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', marginTop:'20px' }}>© 2026 Sistema de Gestión</p>
      </footer>
    </div>
  );
};

export default Home;
