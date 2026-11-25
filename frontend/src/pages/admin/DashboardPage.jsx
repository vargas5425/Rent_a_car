import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function DashboardPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  const esAdmin = usuario.rol === 'ADMINISTRADOR';

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="container py-5 dashboard-container" style={{ marginTop: '80px' }}>
        <div className="mb-5">
          <h1 className="fw-bold mb-1 dashboard-title" style={{ color: 'var(--rc-text)' }}>
            Dashboard
          </h1>
          <p className="text-muted">
            Bienvenido, {usuario.nombre}. Aquí tienes un resumen de tu sistema.
          </p>
        </div>

        <div className="row g-4">
          {/* Card: Inventario (solo admin) */}
          {esAdmin && (
            <div className="col-md-4">
              <div className="card p-4 dashboard-card">
                <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                  Inventario
                </h4>
                <p className="mb-4 dashboard-card-text">
                  Gestiona los vehículos, añade autos nuevos y controla sus estados.
                </p>
                <Link to="/dashboard/admin/vehiculos" className="btn btn-dark w-100 mt-auto">
                  Ir a Vehículos
                </Link>
              </div>
            </div>
          )}

          {/* Card: Reservas */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                Reservas
              </h4>
              <p className="mb-4 dashboard-card-text">
                Revisa las reservas de los clientes y gestiona las entregas.
              </p>
              <Link to="/dashboard/reservas" className="btn btn-dark w-100 mt-auto">
                Ir a Reservas
              </Link>
            </div>
          </div>

          {/* Card: Alquileres pendientes */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                Alquileres pendientes
              </h4>
              <p className="mb-4 dashboard-card-text">
                Consulta los alquileres pendientes y registra la entrega de vehículos a los clientes.
              </p>
              <Link to="/dashboard/alquileres-pendientes" className="btn btn-dark w-100 mt-auto">
                Gestionar entregas
              </Link>
            </div>
          </div>

          {/* Card: Alquileres activos */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                Alquileres activos
              </h4>
              <p className="mb-4 dashboard-card-text">
                Revisa los vehículos actualmente entregados y registra su devolución al finalizar.
              </p>
              <Link to="/dashboard/alquileres-activos" className="btn btn-dark w-100 mt-auto">
                Gestionar devoluciones
              </Link>
            </div>
          </div>

          {/* Card: Historial de alquileres */}
          <div className="col-md-4">
            <div className="card p-4 dashboard-card">
              <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                Historial de alquileres
              </h4>
              <p className="mb-4 dashboard-card-text">
                Consulta alquileres finalizados, kilometrajes, observaciones y cargos adicionales.
              </p>
              <Link to="/dashboard/alquileres-historial" className="btn btn-dark w-100 mt-auto">
                Ver historial
              </Link>
            </div>
          </div>

          {/* Card: Tarifas (solo ADMINISTRADOR) */}
          {esAdmin && (
            <div className="col-md-4">
              <div className="card p-4 dashboard-card">
                <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                  Tarifas
                </h4>
                <p className="mb-4 dashboard-card-text">
                  Configura precios por categoría o vehículo específico.
                </p>
                <Link to="/admin/tarifas" className="btn btn-dark w-100 mt-auto">
                  Gestionar Tarifas
                </Link>
              </div>
            </div>
          )}

          {/* Card: Categorías (solo ADMINISTRADOR) */}
          {esAdmin && (
            <div className="col-md-4">
              <div className="card p-4 dashboard-card">
                <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                  Categorías
                </h4>
                <p className="mb-4 dashboard-card-text">
                  Crea y organiza las categorías de vehículos disponibles para el catálogo.
                </p>
                <Link to="/dashboard/admin/categorias" className="btn btn-dark w-100 mt-auto">
                  Gestionar Categorías
                </Link>
              </div>
            </div>
          )}

          {/* Card: Usuarios (solo ADMINISTRADOR) */}
          {esAdmin && (
            <div className="col-md-4">
              <div className="card p-4 dashboard-card">
                <h4 className="fw-bold mb-2 dashboard-card-title" style={{ color: 'var(--rc-text)' }}>
                  Usuarios
                </h4>
                <p className="mb-4 dashboard-card-text">
                  Administra a los clientes, empleados y roles del sistema.
                </p>
                <Link to="/admin/usuarios" className="btn btn-dark w-100 mt-auto">
                  Gestionar Usuarios
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}