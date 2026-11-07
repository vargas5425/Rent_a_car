import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage'; 
import RegisterPage from './pages/auth/RegisterPage'; 
import VehiculosPage from './pages/client/VehiculosPage';
import DashboardPage from './pages/admin/DashboardPage'; 
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import ProtectedRoute from './components/layout/ProtectedRoute'; 
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';
import AlquileresActivosPage from './pages/employee/AlquileresActivosPage.jsx';
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
      
      {/* Rutas SOLO para Admin y Empleado */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
            <DashboardPage />
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
      
{/* Página de alquileres activos - Empleado y Administrador */}
<Route
  path="/dashboard/alquileres-activos"
  element={
    <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}>
      <AlquileresActivosPage />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
}

export default App;