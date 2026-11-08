import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VehiculosPage from './pages/client/VehiculosPage';
import NuevaReservaPage from './pages/client/NuevaReservaPage';
import MisReservasPage from './pages/client/MisReservasPage';
import DetalleReservaPage from './pages/client/DetalleReservaPage';
import DashboardPage from './pages/admin/DashboardPage';
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import GestionReservasPage from './pages/admin/GestionReservasPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Ruta protegida para ver vehículos (Cualquier usuario logueado) */}
      <Route
        path="/vehiculos"
        element={
          <ProtectedRoute>
            <VehiculosPage />
          </ProtectedRoute>
        }
      />

      {/* Reservas (cualquier usuario logueado; el backend limita al cliente a las suyas) */}
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

      {/* Rutas SOLO para Admin y Empleado */}
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

      {/* Rutas SOLO para Admin */}
      <Route
        path="/vehiculos/crear"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <CrearVehiculoPage />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard/admin/vehiculos" element={
        <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
          <AdminVehiculosPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
