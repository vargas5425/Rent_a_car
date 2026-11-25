import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

function separarFechaYHora(valor) {
  if (!valor) return { fecha: 'Sin registrar', hora: '' };
  const date = new Date(valor);
  if (Number.isNaN(date.getTime())) {
    return { fecha: 'Fecha inválida', hora: '' };
  }

  const fecha = date.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const hora = date.toLocaleTimeString('es-BO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return { fecha, hora };
}

function CeldaFechaHora({ valor }) {
  const { fecha, hora } = separarFechaYHora(valor);
  return (
    <div className="text-nowrap">
      <div>{fecha}</div>
      {hora && <small className="text-muted d-block">{hora}</small>}
    </div>
  );
}

function AlquileresActivosPage() {
  const navigate = useNavigate();
  const [alquileres, setAlquileres] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarAlquileres = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await api.get('/alquileres/activos');
      setAlquileres(respuesta.data.alquileres || []);
    } catch (err) {
      setAlquileres([]);
      setError(
        err.response?.data?.error ||
          err.response?.data?.mensaje ||
          'No se pudieron cargar los alquileres activos.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlquileres();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(alquileres.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const paginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return alquileres.slice(inicio, inicio + POR_PAGINA);
  }, [alquileres, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container pb-5 alquileres-page" style={{ paddingTop: '124px' }}>
        <div className="mb-3">
          <Link
            to="/dashboard"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium"
            style={{
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)',
              backgroundColor: 'var(--rc-card)'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>
              Alquileres activos
            </h2>
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
                <p className="text-secondary mb-1">Total de alquileres activos</p>
                <h2 className="fw-bold mb-0">{alquileres.length}</h2>
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
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-secondary">Cargando alquileres...</p>
          </div>
        ) : !error && alquileres.length === 0 ? (
          <div className="alert alert-info">No hay alquileres activos actualmente.</div>
        ) : !error ? (
          <>
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-semibold">Listado de alquileres</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-nowrap">ID</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th className="text-nowrap">Entrega</th>
                      <th className="text-nowrap">Fin estimado</th>
                      <th className="text-nowrap">Monto</th>
                      <th className="text-nowrap">Estado</th>
                      <th className="text-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginadas.map((alquiler) => (
                      <tr key={alquiler.id}>
                        <td className="fw-semibold text-nowrap">#{alquiler.id}</td>
                        <td>{alquiler.usuario?.nombre || `Cliente #${alquiler.usuario_id}`}</td>
                        <td>
                          {alquiler.vehiculo ? (
                            <>
                              <div className="fw-semibold">
                                {alquiler.vehiculo.marca} {alquiler.vehiculo.modelo}
                              </div>
                              {alquiler.vehiculo.placa && (
                                <small className="text-muted">{alquiler.vehiculo.placa}</small>
                              )}
                            </>
                          ) : (
                            `Vehículo #${alquiler.vehiculo_id}`
                          )}
                        </td>
                        <td>
                          <CeldaFechaHora valor={alquiler.fecha_entrega} />
                        </td>
                        <td>
                          <CeldaFechaHora valor={alquiler.fecha_fin} />
                        </td>
                        <td className="fw-semibold text-nowrap">
                          Bs {Number(alquiler.monto_total).toFixed(2)}
                        </td>
                        <td className="text-nowrap">
                          <span className="badge bg-success">{alquiler.estado}</span>
                        </td>
                        <td className="text-nowrap">
                          <div className="d-inline-flex flex-nowrap gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm text-nowrap"
                              onClick={() =>
                                navigate(`/dashboard/alquileres/${alquiler.id}/devolucion`)
                              }
                            >
                              Registrar devolución
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm text-nowrap"
                              onClick={() =>
                                navigate(`/dashboard/alquileres/${alquiler.id}/pagos`)
                              }
                            >
                              Registrar pago
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {alquileres.length > POR_PAGINA && (
              <nav
                aria-label="Paginación de alquileres activos"
                className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4"
              >
                <small className="text-muted">
                  Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–
                  {Math.min(paginaSegura * POR_PAGINA, alquileres.length)} de {alquileres.length}{' '}
                  alquileres
                </small>

                <ul className="pagination mb-0">
                  <li className={`page-item ${paginaSegura === 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => irAPagina(paginaSegura - 1)}
                      disabled={paginaSegura === 1}
                      style={{
                        backgroundColor: 'var(--rc-card)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    >
                      Anterior
                    </button>
                  </li>

                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((num) => (
                    <li
                      key={num}
                      className={`page-item ${paginaSegura === num ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => irAPagina(num)}
                        style={
                          paginaSegura === num
                            ? undefined
                            : {
                                backgroundColor: 'var(--rc-card)',
                                color: 'var(--rc-text)',
                                borderColor: 'var(--rc-border)'
                              }
                        }
                      >
                        {num}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${paginaSegura === totalPaginas ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => irAPagina(paginaSegura + 1)}
                      disabled={paginaSegura === totalPaginas}
                      style={{
                        backgroundColor: 'var(--rc-card)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default AlquileresActivosPage;