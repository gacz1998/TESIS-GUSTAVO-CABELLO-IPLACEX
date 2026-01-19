import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css'; 

const QuienesSomos = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar animate-fade-in">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 onClick={() => navigate('/')} style={{cursor:'pointer'}}>🚗 Multiservicios J y S</h2>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="btn-outline">Volver al Inicio</button>
        </div>
      </nav>

      <div className="registro-page-container">
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h1 className="animate-float" style={{ textAlign: 'center', color: '#e60000', marginBottom: '20px' }}>
            Nuestra Historia
          </h1>
          
          <div className="about-section-content animate-fade-in">
            <p>
              <strong>Multiservicios J y S</strong> nació en la ciudad de Rancagua con una visión clara: 
              convertirse en el aliado estratégico de todo conductor. Entendemos que el cuidado de un vehículo 
              no es solo estética, sino seguridad y confianza para tu familia.
            </p>
            
            <p style={{ marginTop: '20px' }}>
              Este portal web representa un salto hacia la modernización del servicio automotriz en la Región de O'Higgins, 
              desarrollado íntegramente para la <strong>Tesis de Gustavo Cabello en el año 2026</strong>. 
              Buscamos optimizar los tiempos de espera mediante un sistema inteligente de reservas y membresías.
            </p>

            <h3>Nuestros Pilares</h3>
            <ul className="values-list">
              <li><strong>Compromiso:</strong> Tu vehículo está vigilado las 24 horas del día.</li>
              <li><strong>Tecnología:</strong> Pagos seguros vía Redbank y agendamiento online en tiempo real.</li>
              <li><strong>Excelencia:</strong> Personal capacitado para servicios de mecánica y lavado premium.</li>
            </ul>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button onClick={() => navigate('/registro-cliente')} className="btn-solid">
                Únete como Cliente VIP
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', opacity: 0.6 }}>
        <p>© 2026 Multiservicios J y S - Rancagua</p>
      </footer>
    </div>
  );
};

export default QuienesSomos;