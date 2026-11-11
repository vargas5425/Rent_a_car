
import { Routes, Route } from 'react-router-dom';

// ===================================
// PÁGINAS PÚBLICAS
// ===================================

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// ===================================
// PÁGINAS DE CLIENTES
// ===================================

import VehiculosPage from './pages/client/VehiculosPage';
import NuevaReservaPage from './pages/client/NuevaReservaPage';
import MisReservasPage from './pages/client/MisReservasPage';
import DetalleReservaPage from './pages/client/DetalleReservaPage';

// ===================================
// PÁGINAS DE ADMINISTRACIÓN
// ===================================

import DashboardPage from './pages/admin/DashboardPage';
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';
import GestionReservasPage from './pages/admin/GestionReservasPage';

// ===================================
// PÁGINAS DE EMPLEADOS
// ===================================

import AlquileresActivosPage from './pages/employee/AlquileresActivosPage.jsx';

// ===================================
// PROTECCIÓN DE RUTAS
// ===================================

import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <Routes>

      {/* ===================================
          RUTAS PÚBLICAS
      =================================== */}

      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ===================================
          RUTAS DE CLIENTES
      =================================== */}

      <Route
        path="/vehiculos"
        element={
          <ProtectedRoute>
            <VehiculosPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehiculos/:id/reservar"
        element={
          <ProtectedRoute>
            <NuevaReservaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mis-reservas"
        element={
          <ProtectedRoute>
            <MisReservasPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reservas/:id"
        element={
          <ProtectedRoute>
            <DetalleReservaPage />
          </ProtectedRoute>
        }
      />

      {/* ===================================
          RUTAS DE ADMINISTRADOR Y EMPLEADO
      =================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/reservas"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <GestionReservasPage />
          </ProtectedRoute>
        }
      />

      {/* Alquileres activos */}
      <Route
        path="/dashboard/alquileres-activos"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <AlquileresActivosPage />
          </ProtectedRoute>
        }
      />

      {/* ===================================
          RUTAS SOLO PARA ADMINISTRADORES
      =================================== */}

      <Route
        path="/vehiculos/crear"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <CrearVehiculoPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/vehiculos/:id/editar"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <CrearVehiculoPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/vehiculos"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <AdminVehiculosPage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
