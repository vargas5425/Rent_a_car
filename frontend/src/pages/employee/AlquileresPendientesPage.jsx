
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { obtenerMensajeError } from '../../utils/manejarErrores';
import './AlquileresActivosPage.css';

export default function AlquileresPendientesPage() {
  const navigate = useNavigate();

  const [alquileres, setAlquileres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarAlquileres = async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await api.get('/alquileres/pendientes');

      setAlquileres(
        Array.isArray(respuesta.data?.alquileres)
          ? respuesta.data.alquileres
          : []
      );
    } catch (err) {
      setAlquileres([]);
      setError(
        obtenerMensajeError(
          err,
          'No se pudieron cargar los alquileres pendientes.'
        )
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

    return Number.isNaN(valor.getTime())
      ? 'Fecha inválida'
      : valor.toLocaleString('es-BO');
  };

  return (
    <main className="container py-4 alquileres-page">
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="text-decoration-none"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Alquileres pendientes
          </h2>

          <p className="text-secondary mb-0">
            Gestiona los alquileres que están pendientes
            de entrega.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={cargarAlquileres}
          disabled={cargando}
        >
          {cargando ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-secondary mb-1">
                Total de alquileres pendientes
              </p>

              <h2 className="fw-bold mb-0">
                {alquileres.length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Cargando...
            </span>
          </div>

          <p className="mt-3 text-secondary">
            Cargando alquileres pendientes...
          </p>
        </div>
      ) : !error && alquileres.length === 0 ? (
        <div className="alert alert-info">
          No hay alquileres pendientes de entrega.
        </div>
      ) : !error ? (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-semibold">
              Listado de alquileres pendientes
            </h5>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {alquileres.map((alquiler) => (
                  <tr key={alquiler.id}>
                    <td className="fw-semibold">
                      #{alquiler.id}
                    </td>

                    <td>
                     {alquiler.usuario?.nombre || `Cliente #${alquiler.usuario_id}`}
                    </td>

                    <td>
                        {alquiler.vehiculo
                        ? `${alquiler.vehiculo.marca} ${alquiler.vehiculo.modelo}`
                        : `Vehículo #${alquiler.vehiculo_id}`}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_inicio)}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_fin)}
                    </td>

                    <td className="fw-semibold">
                      Bs {Number(alquiler.monto_total).toFixed(2)}
                    </td>

                    <td>
                      <span className="badge bg-warning text-dark">
                        {alquiler.estado}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          navigate(
                            `/dashboard/alquileres/${alquiler.id}/entrega`
                          )
                        }
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
  );
}
