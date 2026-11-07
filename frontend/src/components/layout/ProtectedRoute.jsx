import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { usuario } = useAuth();

  // Si no está logueado, al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está permitido, lo mandamos a la lista pública de vehículos
  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/vehiculos" replace />; // 👈 Mejor que mandarlo a "/"
  }

  return children;
}