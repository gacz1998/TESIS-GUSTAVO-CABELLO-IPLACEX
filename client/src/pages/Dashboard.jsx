import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [patente, setPatente] = useState('');
  const [autos, setAutos] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [config, setConfig] = useState(null);
  const [userRole, setUserRole] = useState('');
  
  const [vista, setVista] = useState('dashboard');
  const navigate = useNavigate();

  const [listaClientes, setListaClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', rut: '', patente: '', telefono: '' });
  
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nuevaPatenteEdit, setNuevaPatenteEdit] = useState('');

  const [listaReservas, setListaReservas] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
    else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) { console.error("Error token"); }
      cargarDatos();
      cargarConfig();
    }
  }, [navigate]);

  const cargarDatos = async () => {
    try {
      const resAutos = await axios.get('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/attendance/current');
      setAutos(resAutos.data);
      const resVentas = await axios.get('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/sales/history');
      setHistorialVentas(resVentas.data);
    } catch (error) { console.error(error); }
  };

  const cargarConfig = async () => {
    try {
      const res = await axios.get('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/config');
      setConfig(res.data);
      if(res.data.servicios && res.data.servicios.length > 0) {
          setServicioSeleccionado({
            nombre: res.data.servicios[0].nombre,
            precio: res.data.servicios[0].precio
          });
      }
    } catch (e) { console.error(e); }
  };

  const cargarClientes = async () => {
    try {
      const res = await axios.get('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/clients');
      setListaClientes(res.data);
    } catch (e) { console.error(e); }
  };

  const cargarReservas = async () => {
    try {
      const res = await axios.get('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/bookings');
      setListaReservas(res.data);
    } catch (e) { alert('Error al cargar reservas'); }
  };

  const handleAccion = async (tipo) => {
    if (!patente) return alert('Escribe una patente');
    
    try {
      if (tipo === 'entrada') {
          const res = await axios.post(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/attendance/entry`, { patente });
          alert(res.data.msg || "Entrada registrada");
      } else {
          const res = await axios.post(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/attendance/exit`, { patente });
          const t = res.data.ticket;
          
          let mensaje = `TICKET DE SALIDA\n`;
          mensaje += `--------------------------------\n`;
          mensaje += `Patente: ${t.patente}\n`;
          mensaje += `Tiempo: ${t.tiempo} min\n`;
          mensaje += `Estacionamiento: $${t.parking.toLocaleString()}\n`;
          
          if (t.servicios > 0) {
              mensaje += `Servicios Adicionales: $${t.servicios.toLocaleString()}\n`;
              if (t.detalle && t.detalle.length > 0) {
                  t.detalle.forEach(d => {
                      mensaje += `    - ${d.nombre}: $${d.precio.toLocaleString()}\n`;
                  });
              }
          }
          
          mensaje += `--------------------------------\n`;
          mensaje += `TOTAL A PAGAR: $${t.total.toLocaleString()}`;
          alert(mensaje);
      }
      setPatente('');
      await cargarDatos(); 
    } catch (err) { 
        alert('Error: ' + (err.response?.data?.msg || 'Error en el servidor')); 
    }
  };

  const agregarServicio = async () => {
    if (!patente) return alert('Escribe patente');
    if (!servicioSeleccionado) return alert('Selecciona un servicio primero');

    try {
      await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/attendance/add-service', {
        patente,
        servicio: servicioSeleccionado.nombre,
        precio: servicioSeleccionado.precio
      });
      alert('Servicio Agregado');
      setPatente('');
      setVista('dashboard');
      cargarDatos();
    } catch (err) { 
      alert('Error: ' + (err.response?.data?.msg || 'Auto no encontrado')); 
    }
  };

  const crearCliente = async () => {
    if(!nuevoCliente.patente || !nuevoCliente.nombre) return alert("Faltan datos");
    if(confirm('¿Confirmar pago de $50.000 y registrar cliente?')) {
      try {
        const datosAEnviar = {
          ...nuevoCliente,
          patentes: [nuevoCliente.patente.toUpperCase()],
          password: "123"
        };
        await axios.post('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/clients', datosAEnviar);
        alert('Operación Exitosa'); 
        setNuevoCliente({ nombre: '', rut: '', patente: '', telefono: '' }); 
        cargarClientes();
        cargarDatos(); 
      } catch (e) { alert('Error: ' + (e.response?.data?.msg || e.message)); }
    }
  };

  const eliminarCliente = async (id) => {
    if(confirm('¿Seguro que quieres eliminar esta membresía y todos sus datos?')) { 
      try {
        await axios.delete(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/clients/${id}`); 
        cargarClientes(); 
      } catch (e) { alert('Error al eliminar'); }
    }
  };

  const renovarCliente = async (id) => {
    if(!confirm('¿Sumar 30 días a la suscripción?')) return;
    try {
      await axios.put(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/admin/clients/${id}/renew`);
      alert('Renovado exitosamente');
      cargarClientes(); 
    } catch (e) { 
      alert('Error: ' + (e.response?.data?.msg || 'No se pudo renovar')); 
    }
  };
  
  const abrirEdicionAutos = (cliente) => {
      setClienteEditando(cliente);
      setNuevaPatenteEdit('');
  };

  const guardarNuevoAuto = async () => {
      if(!nuevaPatenteEdit) return alert("Escribe una patente");
      const pUpper = nuevaPatenteEdit.toUpperCase();
      const patentesActuales = clienteEditando.patentes || [];
      
      if(patentesActuales.includes(pUpper)) return alert("Esa patente ya existe");
      const nuevasPatentes = [...patentesActuales, pUpper];

      try {
          await axios.put(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/admin/clients/${clienteEditando._id}/patentes`, { patentes: nuevasPatentes });
          alert("Vehículo agregado");
          setClienteEditando({...clienteEditando, patentes: nuevasPatentes});
          setNuevaPatenteEdit('');
          cargarClientes();
      } catch (e) { alert("Error al guardar"); }
  };

  const borrarAuto = async (patenteBorrar) => {
      if(!confirm(`¿Eliminar el vehículo ${patenteBorrar}?`)) return;
      const nuevasPatentes = clienteEditando.patentes.filter(p => p !== patenteBorrar);
      try {
          await axios.put(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/admin/clients/${clienteEditando._id}/patentes`, { patentes: nuevasPatentes });
          setClienteEditando({...clienteEditando, patentes: nuevasPatentes});
          cargarClientes();
      } catch (e) { alert("Error al borrar"); }
  };

  const procesarReserva = async (id) => {
    if(confirm('¿El cliente llegó? Esto ingresará el auto al recinto y cargará el cobro.')) {
      try {
        const res = await axios.post(`https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/bookings/process/${id}`);
        alert(res.data.msg);
        cargarReservas();
        cargarDatos(); 
      } catch (e) { alert('Error: ' + (e.response?.data?.msg || e.message)); }
    }
  };

  const guardarConfig = async () => {
    try {
      await axios.put('https://tesis-gustavo-cabello-iplacex-1.onrender.com/api/config', config);
      alert('Guardado'); setVista('dashboard');
    } catch (e) { alert('Error'); }
  };

  const totalCaja = historialVentas.reduce((sum, v) => sum + v.total_pagado, 0);
  const totalEstacionamiento = historialVentas.reduce((sum, v) => sum + v.total_estacionamiento, 0);
  const totalServicios = historialVentas.reduce((sum, v) => sum + v.total_servicios, 0);

  return (
    <div className="dashboard-container">
      <div className="header-bar">
        <div className="header-info">
          <h2>Multiservicios J y S</h2>
          <small>{userRole === 'admin' ? 'PANEL ADMINISTRADOR' : 'PANEL OPERADOR'}</small>
        </div>
        
        {userRole === 'admin' && (
          <div className="header-caja">
            <small>TOTAL ACUMULADO</small>
            <span className="caja-monto">${totalCaja.toLocaleString('es-CL')}</span>
          </div>
        )}

        <div className="nav-buttons">
          <button onClick={() => setVista('dashboard')} className="btn btn-gray">Inicio</button>
          <button onClick={() => { setVista('reservas'); cargarReservas(); }} className="btn btn-green">Reservas</button>
          {userRole === 'admin' && (
            <>
              <button onClick={() => setVista('reportes')} className="btn btn-purple">Reportes</button>
              <button onClick={() => setVista('config')} className="btn btn-orange">Tarifas</button>
            </>
          )}
          <button onClick={() => { setVista('clientes'); cargarClientes(); }} className="btn btn-blue">Membresías</button>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} className="btn btn-red">Salir</button>
        </div>
      </div>

      {vista === 'reportes' && (
        <div className="panel-white">
          <h3>Registro Detallado</h3>
          <div style={{display:'flex', gap:'20px', marginBottom:'20px'}}>
             <div style={{flex:1, background:'#eafaf1', padding:'20px', borderRadius:'10px', borderLeft:'5px solid #2ecc71'}}>
                <h4>Estacionamiento</h4>
                <span style={{fontSize:'1.5rem', fontWeight:'bold'}}>${totalEstacionamiento.toLocaleString()}</span>
             </div>
             <div style={{flex:1, background:'#f4ecf7', padding:'20px', borderRadius:'10px', borderLeft:'5px solid #8e44ad'}}>
                <h4>Servicios / Membresías</h4>
                <span style={{fontSize:'1.5rem', fontWeight:'bold'}}>${totalServicios.toLocaleString()}</span>
             </div>
          </div>
          <table className="table-clean">
            <thead><tr><th>Fecha</th><th>Patente</th><th>Concepto</th><th>Monto</th></tr></thead>
            <tbody>
              {historialVentas.map(v => (
                <tr key={v._id}>
                  <td>{new Date(v.fecha_pago).toLocaleString()}</td>
                  <td><strong>{v.patente}</strong></td>
                  <td>{v.items.length > 0 ? 'Servicios + Parking' : 'Solo Parking'}</td>
                  <td style={{ fontWeight:'bold', color:'#27ae60' }}>${v.total_pagado.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'config' && config && (
        <div className="panel-white">
          <h3>Tarifas</h3>
          <div style={{display:'flex', gap:'20px', marginBottom:'20px'}}>
            <div><label>Base (30 min): </label><input style={{padding:'10px'}} type="number" value={config.precio_base} onChange={e=>setConfig({...config, precio_base: parseInt(e.target.value)})} /></div>
            <div><label>Minuto Extra: </label><input style={{padding:'10px'}} type="number" value={config.precio_minuto} onChange={e=>setConfig({...config, precio_minuto: parseInt(e.target.value)})} /></div>
          </div>
          <button onClick={guardarConfig} className="btn btn-green">Guardar Cambios</button>
        </div>
      )}

      {vista === 'clientes' && (
        <div className="panel-white">
          <h3>Gestión de Membresías</h3>
          <div style={{background:'#d6eaf8', padding:'15px', borderRadius:'8px', marginBottom:'20px', color:'#2c3e50'}}>
              <strong>NUEVA MEMBRESÍA ($50.000)</strong>
          </div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap'}}>
            <input style={{padding:'10px', flex:1}} placeholder="Nombre Cliente" value={nuevoCliente.nombre} onChange={e=>setNuevoCliente({...nuevoCliente, nombre:e.target.value})} />
            <input style={{padding:'10px', flex:1}} placeholder="RUT" value={nuevoCliente.rut} onChange={e=>setNuevoCliente({...nuevoCliente, rut:e.target.value})} />
            <input style={{padding:'10px', flex:1}} placeholder="Patente" value={nuevoCliente.patente} onChange={e=>setNuevoCliente({...nuevoCliente, patente:e.target.value.toUpperCase()})} />
            <button onClick={crearCliente} className="btn btn-green big-btn">Cobrar y Registrar</button>
          </div>
          <table className="table-clean">
            <thead><tr><th>Cliente</th><th>Patentes</th><th>Vence</th><th>Acción</th></tr></thead>
            <tbody>
              {listaClientes.map(c=>(
                <tr key={c._id}>
                  <td>{c.nombre}<br/><small>{c.rut}</small></td>
                  <td>
                      {c.patentes && c.patentes.map(p => (
                          <span key={p} style={{background:'#eee', padding:'2px 5px', margin:'2px', borderRadius:'4px', fontSize:'0.8rem'}}>{p}</span>
                      ))}
                  </td>
                  <td>{new Date(c.fecha_vencimiento).toLocaleDateString()}</td>
                  <td>
                    <button onClick={()=>abrirEdicionAutos(c)} className="btn btn-blue" style={{fontSize:'0.7rem', marginRight:'5px'}}>Autos</button>
                    <button onClick={()=>renovarCliente(c._id)} className="btn btn-orange" style={{marginRight:'5px', fontSize:'0.7rem'}}>Renovar</button>
                    <button onClick={()=>eliminarCliente(c._id)} className="btn btn-red" style={{fontSize:'0.7rem'}}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clienteEditando && (
              <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000}}>
                  <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}}>
                      <h3 style={{marginBottom: '15px', color: '#2c3e50'}}>Vehículos de {clienteEditando.nombre}</h3>
                      <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '5px'}}>
                          {clienteEditando.patentes && clienteEditando.patentes.map(p => (
                                <div key={p} style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom:'8px', paddingBottom: '8px', borderBottom: '1px solid #f9f9f9'}}>
                                    <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{p}</span>
                                    <button onClick={()=>borrarAuto(p)} style={{color:'white', background: '#e74c3c', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem'}}>Eliminar</button>
                                </div>
                            ))}
                      </div>
                      <div style={{display:'flex', gap:'5px', borderTop: '2px solid #eee', paddingTop: '15px'}}>
                          <input placeholder="Nueva Patente" value={nuevaPatenteEdit} onChange={e=>setNuevaPatenteEdit(e.target.value.toUpperCase())} style={{padding:'10px', flex:1, border: '1px solid #ccc', borderRadius: '4px'}} />
                          <button onClick={guardarNuevoAuto} className="btn btn-green">Agregar</button>
                      </div>
                      <button onClick={()=>setClienteEditando(null)} style={{marginTop:'15px', width:'100%', padding:'10px', background:'#95a5a6', color: 'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Cerrar Ventana</button>
                  </div>
              </div>
          )}
        </div>
      )}

      {vista === 'reservas' && (
        <div className="panel-white">
          <h3>Gestión de Agenda</h3>
          {listaReservas.length === 0 ? <p>No hay reservas pendientes.</p> : (
            <table className="table-clean">
              <thead><tr><th>Fecha</th><th>Hora</th><th>Servicio</th><th>Cliente</th><th>Acción</th></tr></thead>
              <tbody>
                {listaReservas.map(r => (
                  <tr key={r._id}>
                    <td>{r.fecha}</td>
                    <td>{r.hora}</td>
                    <td>{r.servicio}</td>
                    <td>{r.cliente}<br/><small>{r.patente}</small></td>
                    <td>
                        <button onClick={()=>procesarReserva(r._id)} className="btn btn-green">Ingresar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(vista === 'dashboard' || vista === 'servicios') && (
        <>
          <div className="control-panel">
            <input className="input-patente" value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="PATENTE" />
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
              {vista !== 'servicios' ? (
                <>
                  <button onClick={() => handleAccion('entrada')} className="btn btn-green big-btn">ENTRADA</button>
                  <button onClick={() => handleAccion('salida')} className="btn btn-orange big-btn">SALIDA</button>
                  <button onClick={() => setVista('servicios')} className="btn btn-purple big-btn">SERVICIOS</button>
                </>
              ) : (
                <>
                  <select 
                    style={{padding:'10px'}} 
                    value={servicioSeleccionado ? `${servicioSeleccionado.nombre},${servicioSeleccionado.precio}` : ""}
                    onChange={(e) => { 
                      const [n, p] = e.target.value.split(','); 
                      setServicioSeleccionado({ nombre: n, precio: parseInt(p) }); 
                    }}
                  >
                    {config && config.servicios.map((s, i) => (
                      <option key={i} value={`${s.nombre},${s.precio}`}>
                        {s.nombre} (${s.precio})
                      </option>
                    ))}
                  </select>
                  <button onClick={agregarServicio} className="btn btn-purple big-btn">AGREGAR</button>
                  <button onClick={() => setVista('dashboard')} className="btn btn-gray big-btn">Cancelar</button>
                </>
              )}
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="column">
              <h3>En Recinto ({autos.length})</h3>
              {autos.map(a => (
                <div key={a._id} className="list-item">
                  <div className="item-info">
                    <strong>{a.patente}</strong> <small>{new Date(a.entry_time).toLocaleTimeString()}</small>
                  </div>
                  <div style={{textAlign:'right'}}>
                      {a.servicios && a.servicios.length > 0 && <small style={{display:'block', color:'#2980b9'}}>+ {a.servicios.length} Serv.</small>}
                      {a.tipo_cliente === 'abonado' && <span style={{color:'#27ae60', fontWeight:'bold'}}>ABONADO</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="column">
              <h3>Ventas Recientes</h3>
              {historialVentas.slice(0, 5).map(v => (
                <div key={v._id} className="list-item">
                  <strong>{v.patente}</strong> <span style={{color:'green'}}>${v.total_pagado.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
