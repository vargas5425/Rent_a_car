import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VehiculosPage from './pages/client/VehiculosPage';
import DashboardPage from './pages/admin/DashboardPage';
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';
import GestionReservasPage from './pages/admin/GestionReservasPage'; 

// 👇 Asegúrate de que estas importaciones apunten a las rutas correctas de tus archivos
import NuevaReservaPage from './pages/client/NuevaReservaPage'; 
import MisReservasPage from './pages/client/MisReservasPage'; 
import DetalleReservaPage from './pages/client/DetalleReservaPage'; 

import ProtectedRoute from './components/layout/ProtectedRoute'; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas de Cliente */}
      <Route path="/vehiculos" element={<ProtectedRoute><VehiculosPage /></ProtectedRoute>} />
      
      {/* 👇 RUTA QUE FALTABA: Formulario de reserva */}
      <Route path="/vehiculos/:id/reservar" element={<ProtectedRoute><NuevaReservaPage /></ProtectedRoute>} />
      
      <Route path="/mis-reservas" element={<ProtectedRoute><MisReservasPage /></ProtectedRoute>} />
      <Route path="/reservas/:id" element={<ProtectedRoute><DetalleReservaPage /></ProtectedRoute>} />

      {/* Rutas de Admin/Empleado */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/reservas" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><GestionReservasPage /></ProtectedRoute>} />
      
      {/* Rutas solo Admin */}
      <Route path="/vehiculos/crear" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']}><CrearVehiculoPage /></ProtectedRoute>} />
      <Route path="/dashboard/admin/vehiculos" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']}><AdminVehiculosPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;