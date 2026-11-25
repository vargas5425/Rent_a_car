import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  listarTodasLasReservas,
  confirmarReserva,
  cancelarReserva,
  crearAlquilerDesdeReserva
} from '../../services/reservasService';
import {
  ESTADOS_RESERVA,
  ETIQUETA_ESTADO,
  formatearBs,
  puedeCancelar
} from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

const estiloBotonAccion = {
  width: '96px',
  height: '32px',
  padding: '0 8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1
};

function separarFechaYHora(valor) {
  if (!valor) return { fecha: '—', hora: '' };
  const date = new Date(valor);
  if (Number.isNaN(date.getTime())) {
    return { fecha: String(valor), hora: '' };
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

export default function GestionReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [accionEnCurso, setAccionEnCurso] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const cargar = async () => {
      setCargando(true);
      setError('');

      try {
        const datos = await listarTodasLasReservas();
        if (isMounted) setReservas(datos);
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.error ||
              err.response?.data?.mensaje ||
              'No se pudieron cargar las reservas.'
          );
        }
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    cargar();

    return () => {
      isMounted = false;
    };
  }, [recarga]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtro]);

  const ejecutar = async (accion, id, mensajeError) => {
    if (accionEnCurso !== null) return;

    setAccionEnCurso(id);
    setError('');

    try {
      await accion(id);
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.mensaje ||
          mensajeError
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  const handleCrearAlquiler = async (reservaId) => {
    const confirmar = window.confirm(`¿Deseas crear un alquiler para la reserva R-${reservaId}?`);
    if (!confirmar) return;

    try {
      setError('');
      const alquiler = await crearAlquilerDesdeReserva(reservaId);
      window.alert(`Alquiler #${alquiler.id} creado correctamente. Ya está pendiente de entrega.`);
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.mensaje ||
          'No se pudo crear el alquiler.'
      );
    }
  };

  const handleCancelar = (id) => {
    if (window.confirm('¿Seguro que deseas cancelar esta reserva?')) {
      ejecutar(cancelarReserva, id, 'No se pudo cancelar la reserva.');
    }
  };

  const visibles = useMemo(() => {
    return filtro === 'TODAS' ? reservas : reservas.filter((r) => r.estado === filtro);
  }, [reservas, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const paginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return visibles.slice(inicio, inicio + POR_PAGINA);
  }, [visibles, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px' }}>
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

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>
            Gestión de Reservas
          </h2>

          <select
            className="form-select w-auto"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              backgroundColor: 'var(--rc-card)',
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)'
            }}
          >
            <option value="TODAS">Todos los estados</option>
            {[...ESTADOS_RESERVA, 'CANCELADA'].map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETA_ESTADO[estado]}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {cargando && <p className="text-muted">Cargando reservas...</p>}

        <div
          className="table-responsive shadow-sm rounded-3"
          style={{ backgroundColor: 'var(--rc-card)', border: '1px solid var(--rc-border)' }}
        >
          <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
            <thead className="table-dark">
              <tr>
                <th className="text-nowrap">N°</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th className="text-nowrap">Entrega</th>
                <th className="text-nowrap">Devolución</th>
                <th className="text-nowrap">Total</th>
                <th className="text-nowrap">Estado</th>
                <th className="text-center text-nowrap">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!cargando && !error && paginadas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No hay reservas para mostrar.
                  </td>
                </tr>
              ) : !cargando && !error ? (
                paginadas.map((r) => {
                  const esConfirmada = r.estado === 'CONFIRMADA';
                  const puedeConfirmar = r.estado === 'RESERVADA';
                  const puedeCancelarFila = puedeCancelar(r.estado);

                  return (
                    <tr key={r.id}>
                      <td className="text-nowrap">
                        <strong>R-{r.id}</strong>
                      </td>
                      <td>{r.usuario ? r.usuario.nombre : '—'}</td>
                      <td>
                        {r.vehiculo ? (
                          <>
                            <div className="fw-semibold">{r.vehiculo.marca} {r.vehiculo.modelo}</div>
                            {r.vehiculo.placa && (
                              <small className="text-muted">{r.vehiculo.placa}</small>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <CeldaFechaHora valor={r.fecha_inicio} />
                      </td>
                      <td>
                        <CeldaFechaHora valor={r.fecha_fin} />
                      </td>
                      <td className="text-nowrap fw-semibold">{formatearBs(r.total)}</td>
                      <td className="text-nowrap">
                        <EstadoBadge estado={r.estado} />
                      </td>
                      <td className="text-center text-nowrap">
                        <div className="d-inline-flex align-items-center justify-content-center gap-2 flex-nowrap">
                          <Link
                            to={`/reservas/${r.id}`}
                            className="btn rounded-2"
                            style={{
                              ...estiloBotonAccion,
                              color: '#111827',
                              backgroundColor: '#ffffff',
                              border: '1px solid #111827'
                            }}
                          >
                            Ver
                          </Link>

                          {esConfirmada ? (
                            <button
                              type="button"
                              className="btn btn-primary rounded-2"
                              style={estiloBotonAccion}
                              onClick={() => handleCrearAlquiler(r.id)}
                              disabled={accionEnCurso !== null}
                            >
                              Crear alquiler
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-dark rounded-2"
                              style={estiloBotonAccion}
                              onClick={() =>
                                ejecutar(confirmarReserva, r.id, 'No se pudo confirmar la reserva.')
                              }
                              disabled={!puedeConfirmar || accionEnCurso !== null}
                            >
                              {accionEnCurso === r.id && puedeConfirmar ? 'Espere...' : 'Confirmar'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger rounded-2"
                            style={estiloBotonAccion}
                            onClick={() => handleCancelar(r.id)}
                            disabled={!puedeCancelarFila || accionEnCurso !== null}
                          >
                            {accionEnCurso === r.id && puedeCancelarFila ? 'Espere...' : 'Cancelar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : null}
            </tbody>
          </table>
        </div>

        {!cargando && !error && visibles.length > POR_PAGINA && (
          <nav
            aria-label="Paginación de reservas"
            className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4"
          >
            <small className="text-muted">
              Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–
              {Math.min(paginaSegura * POR_PAGINA, visibles.length)} de {visibles.length} reservas
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
      </div>
    </div>
  );
}