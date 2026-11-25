import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

function yaTieneEntregaRegistrada(alquiler, entregadosEnSesion) {
  if (!alquiler) return false;
  if (entregadosEnSesion.has(String(alquiler.id))) return true;
  if (alquiler.fecha_entrega || alquiler.fechaEntrega || alquiler.entrega || alquiler.entregado) {
    return true;
  }
  const estado = String(alquiler.estado || '').toUpperCase();
  return estado === 'ENTREGADO' || estado === 'EN_CURSO' || estado === 'ACTIVO';
}

export default function AlquileresPendientesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [alquileres, setAlquileres] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [entregadosEnSesion, setEntregadosEnSesion] = useState(() => new Set());

  useEffect(() => {
    const idEntregado = location.state?.entregaRegistradaId;
    if (idEntregado != null) {
      setEntregadosEnSesion((prev) => {
        const siguiente = new Set(prev);
        siguiente.add(String(idEntregado));
        return siguiente;
      });
    }
  }, [location.state]);

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

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registrar';
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? 'Fecha inválida' : valor.toLocaleString('es-BO');
  };

  const handleIrAEntrega = (alquilerId) => {
    setEntregadosEnSesion((prev) => {
      const siguiente = new Set(prev);
      siguiente.add(String(alquilerId));
      return siguiente;
    });
    navigate(`/dashboard/alquileres/${alquilerId}/entrega`, {
      state: { alquilerId }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main
        className="container pb-5 alquileres-page"
        style={{ paddingTop: '124px' }}
      >
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
              Alquileres pendientes
            </h2>
            <p className="text-secondary mb-0">
              Gestiona los alquileres que están pendientes de entrega.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => cargarAlquileres()}
            disabled={cargando}
          >
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

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-secondary">Cargando alquileres pendientes...</p>
          </div>
        ) : !error && alquileres.length === 0 ? (
          <div className="alert alert-info">No hay alquileres pendientes de entrega.</div>
        ) : !error ? (
          <>
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-semibold">Listado de alquileres pendientes</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-nowrap">Alquiler / Reserva</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th className="text-nowrap">Inicio / Fin</th>
                      <th className="text-nowrap">Modalidad</th>
                      <th className="text-nowrap">Monto</th>
                      <th className="text-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginadas.map((alquiler) => {
                      const entregaRegistrada = yaTieneEntregaRegistrada(
                        alquiler,
                        entregadosEnSesion
                      );

                      return (
                        <tr key={alquiler.id}>
                          <td className="text-nowrap">
                            <div className="fw-semibold">A-{alquiler.id}</div>
                            <small className="text-muted">
                              Reserva: R-{alquiler.reserva_id || '-'}
                            </small>
                          </td>
                          <td>{alquiler.usuario?.nombre || `Cliente #${alquiler.usuario_id}`}</td>
                          <td>
                            {alquiler.vehiculo ? (
                              <>
                                <div>
                                  {alquiler.vehiculo.marca} {alquiler.vehiculo.modelo}
                                </div>
                                <small className="text-muted">{alquiler.vehiculo.placa}</small>
                              </>
                            ) : (
                              `Vehículo #${alquiler.vehiculo_id}`
                            )}
                          </td>
                          <td className="text-nowrap">
                            <div className="small">Del: {formatearFecha(alquiler.fecha_inicio)}</div>
                            <div className="small">Al: {formatearFecha(alquiler.fecha_fin)}</div>
                          </td>
                          <td className="text-nowrap">
                            <span className="badge bg-info text-dark">
                              {alquiler.modalidad || 'N/A'}
                            </span>
                          </td>
                          <td className="fw-semibold text-nowrap">
                            Bs {Number(alquiler.monto_total).toFixed(2)}
                          </td>
                          <td className="text-nowrap">
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                entregaRegistrada ? 'btn-secondary' : 'btn-primary'
                              }`}
                              disabled={entregaRegistrada}
                              onClick={() => handleIrAEntrega(alquiler.id)}
                            >
                              {entregaRegistrada ? 'Entrega registrada' : 'Registrar entrega'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {alquileres.length > POR_PAGINA && (
              <nav
                aria-label="Paginación de alquileres pendientes"
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