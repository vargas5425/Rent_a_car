import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import user from '../../assets/images/user.jfif';
import reserva from '../../assets/images/reserva.jfif';
import vehiculo from '../../assets/images/vehi.jpg';


export default function DashboardPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="container py-5 dashboard-container">
        <div className="mb-5">
          <h1 className="fw-bold mb-1 dashboard-title">Dashboard</h1>
          <p className="text-muted">
            Bienvenido, {usuario.nombre}. Aquí tienes un resumen de tu sistema.
          </p>
        </div>

        <div className="row g-4">
          {/* Card: Inventario */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center dashboard-icon dashboard-icon--info">
                    <img src={vehiculo} alt="vehiculos" />
                </div>
              </div>
              <h4 className="fw-bold mb-1 dashboard-card-title">Inventario</h4>
              <p className="mb-4 dashboard-card-text">
                Gestiona los vehículos, añade autos nuevos y controla sus estados.
              </p>
              <Link to="/dashboard/admin/vehiculos" className="btn btn-dark w-100 mt-auto">
                Ir a Vehículos
              </Link>
            </div>
          </div>

          {/* Card: Reservas */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center dashboard-icon dashboard-icon--success">
                  <img src={reserva} alt="reservas" />
                </div>
              </div>
              <h4 className="fw-bold mb-1 dashboard-card-title">Reservas</h4>
              <p className="mb-4 dashboard-card-text">
                Revisa las reservas de los clientes y gestiona las entregas.
              </p>
              <Link to="/dashboard/reservas" className="btn btn-dark w-100 mt-auto">
                Ir a Reservas
              </Link>
            </div>
          </div>

          {/* Card: Usuarios (solo ADMINISTRADOR) */}
          {usuario.rol === 'ADMINISTRADOR' && (
            <div className="col-md-4">
              <div className="card p-4 dashboard-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center dashboard-icon dashboard-icon--info">
                    <img src={user} alt="usuarios" />
                  </div>
                </div>
                <h4 className="fw-bold mb-1 dashboard-card-title">Usuarios</h4>
                <p className="mb-4 dashboard-card-text">
                  Administra a los clientes, empleados y configuraciones del sistema.
                </p>
                <button className="btn btn-outline-secondary w-100 mt-auto" disabled>
                  Próximamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}