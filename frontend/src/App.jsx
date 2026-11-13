
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
import AdminTarifasPage from './pages/admin/AdminTarifasPage';

// ===================================
// PÁGINAS DE EMPLEADOS
// ===================================

import AlquileresActivosPage from './pages/employee/AlquileresActivosPage.jsx';
import CargosAdicionalesPage from './pages/employee/CargosAdicionalesPage.jsx';
import DevolucionPage from './pages/employee/DevolucionPage.jsx';
import HistorialAlquileresPage from './pages/employee/HistorialAlquileresPage.jsx';
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

      <Route
        path="/dashboard/alquileres-activos"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <AlquileresActivosPage />
          </ProtectedRoute>
        }
      />
      

      <Route
        path="/dashboard/alquileres-historial"
        element={
          <ProtectedRoute
            allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}
          >
            <HistorialAlquileresPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/alquileres/:id/devolucion"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <DevolucionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/alquileres/:id/cargos-adicionales"
        element={
          <ProtectedRoute
            allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}
          >
            <CargosAdicionalesPage />
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

      {/* Administración de tarifas */}
      <Route
        path="/admin/tarifas"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <AdminTarifasPage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
