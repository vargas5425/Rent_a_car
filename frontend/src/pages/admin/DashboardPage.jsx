import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function DashboardPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px' }}>
        
        {/* Cabecera */}
        <div className="mb-5">
          <h1 className="fw-bold mb-1" style={{ color: 'var(--brand-primary)' }}>Dashboard</h1>
          <p className="text-muted">Bienvenido, {usuario.nombre}. Aquí tienes un resumen de tu sistema.</p>
        </div>

        <div className="row g-4">
          {/* Tarjeta 1 */}
          <div className="col-md-4">
            <div className="card h-100 p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  🚗
                </div>
              </div>
              <h4 className="fw-bold mb-1">Inventario</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Gestiona los vehículos, añade autos nuevos y controla sus estados.</p>
              <Link to="/dashboard/admin/vehiculos" className="btn btn-dark w-100 mt-auto">Ir a Vehículos</Link>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="col-md-4">
            <div className="card h-100 p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10" style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  📅
                </div>
              </div>
              <h4 className="fw-bold mb-1">Reservas</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Revisa las reservas de los clientes y gestiona las entregas.</p>
              <Link to="/dashboard/reservas" className="btn btn-dark w-100 mt-auto">Ir a Reservas</Link>
            </div>
          </div>

          {/* Tarjeta 3 (Solo Admin) */}
          {usuario.rol === 'ADMINISTRADOR' && (
            <div className="col-md-4">
              <div className="card h-100 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-info bg-opacity-10" style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                    👥
                  </div>
                </div>
                <h4 className="fw-bold mb-1">Usuarios</h4>
                <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Administra a los clientes, empleados y configuraciones del sistema.</p>
                <button className="btn btn-outline-secondary w-100 mt-auto" disabled>Próximamente</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}