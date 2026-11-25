import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VehiculosPage from './pages/client/VehiculosPage';
import DashboardPage from './pages/admin/DashboardPage';
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';
import GestionReservasPage from './pages/admin/GestionReservasPage'; 
import NuevaReservaPage from './pages/client/NuevaReservaPage'; 
import MisReservasPage from './pages/client/MisReservasPage'; 
import DetalleReservaPage from './pages/client/DetalleReservaPage'; 
import AdminTarifasPage from './pages/admin/AdminTarifasPage';
import VehiculoDetallePage from './pages/client/VehiculoDetallePage';

// IMPORTAMOS LAS PÁGINAS DE ALQUILERES Y PAGOS
import AlquileresActivosPage from './pages/employee/AlquileresActivosPage';
import AlquileresPendientesPage from './pages/employee/AlquileresPendientesPage';
import EntregaPage from './pages/employee/EntregaPage';
import DevolucionPage from './pages/employee/DevolucionPage';
import CargosAdicionalesPage from './pages/employee/CargosAdicionalesPage';
import HistorialAlquileresPage from './pages/employee/HistorialAlquileresPage';
import RegistrarPagoPage from './pages/employee/RegistrarPagoPage';

import ProtectedRoute from './components/layout/ProtectedRoute';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas de Cliente */}
        <Route path="/vehiculos" element={<ProtectedRoute><VehiculosPage /></ProtectedRoute>} />
        <Route path="/vehiculos/:id" element={<ProtectedRoute><VehiculoDetallePage /></ProtectedRoute>} />
        
        {/* RUTA: Formulario de reserva */}
        <Route path="/vehiculos/:id/reservar" element={<ProtectedRoute><NuevaReservaPage /></ProtectedRoute>} />
        
        <Route path="/mis-reservas" element={<ProtectedRoute><MisReservasPage /></ProtectedRoute>} />
        <Route path="/reservas/:id" element={<ProtectedRoute><DetalleReservaPage /></ProtectedRoute>} />

        {/* Rutas de Admin/Empleado */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/reservas" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><GestionReservasPage /></ProtectedRoute>} />
        
        {/* RUTAS DE ALQUILERES, ENTREGAS, DEVOLUCIONES Y PAGOS */}
        <Route 
          path="/dashboard/alquileres-pendientes" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><AlquileresPendientesPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres-activos" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><AlquileresActivosPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres/:id/entrega" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><EntregaPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres/:id/devolucion" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><DevolucionPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres/:id/pagos" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><RegistrarPagoPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres/:id/cargos-adicionales" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><CargosAdicionalesPage /></ProtectedRoute>} 
        />
        <Route 
          path="/dashboard/alquileres-historial" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><HistorialAlquileresPage /></ProtectedRoute>} 
        />

        {/* Rutas solo Admin */}
        <Route path="/vehiculos/crear" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']}><CrearVehiculoPage /></ProtectedRoute>} />
        <Route path="/dashboard/admin/vehiculos/:id/editar" 
          element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']}><CrearVehiculoPage /></ProtectedRoute>} 
        />
        <Route path="/dashboard/admin/vehiculos" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']}><AdminVehiculosPage /></ProtectedRoute>} />
        <Route 
          path="/admin/tarifas" 
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminTarifasPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;