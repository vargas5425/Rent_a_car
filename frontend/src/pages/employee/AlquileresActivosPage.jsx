import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AlquileresActivosPage.css';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

function AlquileresActivosPage() {
  const navigate = useNavigate();

  const [alquileres, setAlquileres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarAlquileres = async () => {
    try {
      setCargando(true);
      setError('');

      // Ajustar esta clave si el login utiliza otra.
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No se encontró una sesión activa.');
        return;
      }

      const respuesta = await axios.get(
        `${API_URL}/alquileres/activos`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAlquileres(respuesta.data.alquileres || []);
    } catch (err) {
      console.error('Error al cargar alquileres:', err);

      if (err.response?.status === 401 ||
          err.response?.status === 403) {
        setError('Tu sesión no es válida o no tienes permisos.');
      } else {
        setError('No se pudieron cargar los alquileres activos.');
      }
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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Alquileres activos</h2>
          <p className="text-secondary mb-0">
            Consulta los vehículos actualmente alquilados.
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
                Total de alquileres activos
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
            Cargando alquileres...
          </p>
        </div>
      ) : !error && alquileres.length === 0 ? (
        <div className="alert alert-info">
          No hay alquileres activos actualmente.
        </div>
      ) : !error && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-semibold">
              Listado de alquileres
            </h5>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Fecha de inicio</th>
                  <th>Fecha de fin</th>
                  <th>Entrega</th>
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
                      Cliente #{alquiler.usuario_id}
                    </td>

                    <td>
                      Vehículo #{alquiler.vehiculo_id}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_inicio)}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_fin)}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_entrega)}
                    </td>

                    <td className="fw-semibold">
                      Bs {Number(alquiler.monto_total).toFixed(2)}
                    </td>

                    <td>
                      <span className="badge bg-success">
                        {alquiler.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate(`/dashboard/alquileres/${alquiler.id}/devolucion`)
                        }
                      >
                        Registrar devolución
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

export default AlquileresActivosPage;
