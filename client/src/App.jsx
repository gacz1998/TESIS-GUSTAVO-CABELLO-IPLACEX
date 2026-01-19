import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login'; // Dashboard Admin Login
import Dashboard from './pages/Dashboard'; // Dashboard Admin Panel

// Importaciones de Clientes
import ClientLogin from './pages/ClientLogin'; 
import ClientPortal from './pages/ClientPortal'; 
import RegistroCliente from './pages/RegistroCliente'; 

// Importaciones de Información
import QuienesSomos from './pages/QuienesSomos'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Home />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/registro-cliente" element={<RegistroCliente />} />
        
        {/* --- RUTAS DE ADMINISTRADOR (PERSONAL) --- */}
        <Route path="/login-admin" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* --- RUTAS DE CLIENTES --- */}
        <Route path="/login-cliente" element={<ClientLogin />} />
        <Route path="/portal-cliente" element={<ClientPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;