import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function AlquileresPendientesPage() {
  const navigate = useNavigate();
  const [alquileres, setAlquileres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarAlquileres = async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true);
      setError('');
    }
    try {
      const respuesta = await api.get('/alquileres/pendientes');
      setAlquileres(respuesta.data.alquileres || []);
    } catch (err) {
      setAlquileres([]);
      setError(
        err.response?.data?.error || 
        err.response?.data?.mensaje || 
        'No se pudieron cargar los alquileres pendientes.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlquileres();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registrar';
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? 'Fecha inválida' : valor.toLocaleString('es-BO');
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container py-4 alquileres-page" style={{ marginTop: '80px' }}>
        <div className="mb-4">
          <Link to="/dashboard" className="text-decoration-none">← Volver al Dashboard</Link>
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>Alquileres pendientes</h2>
            <p className="text-secondary mb-0">Gestiona los alquileres que están pendientes de entrega.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => cargarAlquileres()} disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Actualizar lista'}
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="text-secondary mb-1">Total de alquileres pendientes</p>
                <h2 className="fw-bold mb-0">{alquileres.length}</h2>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-secondary">Cargando alquileres pendientes...</p>
          </div>
        ) : !error && alquileres.length === 0 ? (
          <div className="alert alert-info">No hay alquileres pendientes de entrega.</div>
        ) : !error ? (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold">Listado de alquileres pendientes</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Alquiler / Reserva</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Inicio / Fin</th>
                    <th>Modalidad</th>
                    <th>Monto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alquileres.map((alquiler) => (
                    <tr key={alquiler.id}>
                      <td>
                        <div className="fw-semibold">A-{alquiler.id}</div>
                        <small className="text-muted">Reserva: R-{alquiler.reserva_id || '-'}</small>
                      </td>
                      <td>{alquiler.usuario?.nombre || `Cliente #${alquiler.usuario_id}`}</td>
                      <td>
                        {alquiler.vehiculo ? (
                          <>
                            <div>{alquiler.vehiculo.marca} {alquiler.vehiculo.modelo}</div>
                            <small className="text-muted">{alquiler.vehiculo.placa}</small>
                          </>
                        ) : `Vehículo #${alquiler.vehiculo_id}`}
                      </td>
                      <td>
                        <div className="small">Del: {formatearFecha(alquiler.fecha_inicio)}</div>
                        <div className="small">Al: {formatearFecha(alquiler.fecha_fin)}</div>
                      </td>
                      <td><span className="badge bg-info text-dark">{alquiler.modalidad || 'N/A'}</span></td>
                      <td className="fw-semibold">Bs {Number(alquiler.monto_total).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/dashboard/alquileres/${alquiler.id}/entrega`)}
                        >
                          Registrar entrega
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}