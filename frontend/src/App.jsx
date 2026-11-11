import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage'; 
import RegisterPage from './pages/auth/RegisterPage'; 
import VehiculosPage from './pages/client/VehiculosPage';
import DashboardPage from './pages/admin/DashboardPage'; 
import CrearVehiculoPage from './pages/admin/CrearVehiculoPage';
import ProtectedRoute from './components/layout/ProtectedRoute'; 
import AdminVehiculosPage from './pages/admin/AdminVehiculosPage';
import AdminTarifasPage from './pages/admin/AdminTarifasPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />      
      <Route path="/register" element={<RegisterPage />} /> 
     <Route 
  path="/admin/tarifas" 
  element={
    <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
      <AdminTarifasPage />
    </ProtectedRoute>
  } 
/>
      
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
    </Routes>
  );
}

export default App;