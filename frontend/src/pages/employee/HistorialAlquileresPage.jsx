import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import api from '../../services/api';
import { finalizarReserva as finalizarReservaService } from '../../services/reservasService';

const POR_PAGINA = 5;

const ESTILO_BOTON_ACCION = {
  width: '96px',
  height: '32px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

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

function HistorialAlquileresPage() {
  const navigate = useNavigate();
  const [alquileres, setAlquileres] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState(null);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      setError('');
      const respuesta = await api.get('/alquileres/historial');
      setAlquileres(respuesta.data.alquileres || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
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

  const finalizarReserva = async (alquiler) => {
    const reservaId = alquiler?.reserva_id;
    if (!reservaId) {
      alert('Este alquiler no tiene una reserva asociada.');
      return;
    }

    const saldoPendiente = Number(alquiler?.saldo_pendiente ?? 0);
    if (saldoPendiente > 0) {
      alert(`No se puede finalizar: aún existe un saldo pendiente de Bs ${saldoPendiente.toFixed(2)}.`);
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de finalizar la reserva #${reservaId}?`);
    if (!confirmar) return;

    try {
      await finalizarReservaService(reservaId);
      alert('Reserva finalizada correctamente.');
      cargarHistorial();
    } catch (err) {
      console.error('Error al finalizar reserva:', err);
      alert(err.response?.data?.error || 'No se pudo finalizar la reserva.');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registrar';
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? 'Fecha inválida' : valor.toLocaleString('es-BO');
  };

  const formatearMonto = (monto) => `Bs ${Number(monto ?? 0).toFixed(2)}`;

  return (
    <div
      className="historial-alquileres-page"
      style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}
    >
      <Navbar />

      <main className="container pb-5" style={{ paddingTop: '124px' }}>
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
              Historial de alquileres
            </h2>
            <p className="text-secondary mb-0">
              Consulta los alquileres finalizados, cargos adicionales y estado de pagos.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/dashboard/alquileres-activos" className="btn btn-outline-secondary">
              Alquileres activos
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={cargarHistorial}
              disabled={cargando}
            >
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
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
            <p className="mt-3 text-secondary">Cargando historial...</p>
          </div>
        ) : !error && alquileres.length === 0 ? (
          <div className="alert alert-info">No existen alquileres finalizados.</div>
        ) : !error ? (
          <>
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-nowrap">Alquiler / Reserva</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th className="text-nowrap">Devolución</th>
                      <th className="text-nowrap">Total final</th>
                      <th className="text-nowrap">Total pagado</th>
                      <th className="text-nowrap">Saldo pendiente</th>
                      <th className="text-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginadas.map((alquiler) => {
                      const saldo = Number(alquiler.saldo_pendiente ?? 0);
                      return (
                        <tr key={alquiler.id}>
                          <td className="text-nowrap">
                            <div className="fw-semibold">A-{alquiler.id}</div>
                            <small className="text-muted">R-{alquiler.reserva_id || 'N/A'}</small>
                          </td>
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
                            <CeldaFechaHora valor={alquiler.fecha_devolucion} />
                          </td>
                          <td className="fw-bold text-nowrap">
                            {formatearMonto(alquiler.total_final)}
                          </td>
                          <td className="fw-semibold text-success text-nowrap">
                            {formatearMonto(alquiler.total_pagado)}
                          </td>
                          <td
                            className={`fw-bold text-nowrap ${
                              saldo > 0 ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {formatearMonto(saldo)}
                          </td>
                          <td className="text-nowrap">
                            <div className="d-inline-flex flex-nowrap gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info text-nowrap"
                                style={ESTILO_BOTON_ACCION}
                                onClick={() => setAlquilerSeleccionado(alquiler)}
                              >
                                Detalles
                              </button>

                              {saldo > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success text-nowrap"
                                  style={ESTILO_BOTON_ACCION}
                                  onClick={() =>
                                    navigate(`/dashboard/alquileres/${alquiler.id}/pagos`)
                                  }
                                >
                                  Pagos
                                </button>
                              )}

                              {alquiler.estado_reserva === 'DEVUELTA' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success text-nowrap"
                                  style={ESTILO_BOTON_ACCION}
                                  disabled={saldo > 0}
                                  title={
                                    saldo > 0
                                      ? 'Debe cubrir el saldo pendiente antes de finalizar'
                                      : 'Finalizar reserva'
                                  }
                                  onClick={() => finalizarReserva(alquiler)}
                                >
                                  Finalizar
                                </button>
                              )}
                            </div>
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
                aria-label="Paginación de historial de alquileres"
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

        {alquilerSeleccionado && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setAlquilerSeleccionado(null)}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    Detalles del alquiler #{alquilerSeleccionado.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAlquilerSeleccionado(null)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <strong>Fecha entrega:</strong>{' '}
                      {formatearFecha(alquilerSeleccionado.fecha_entrega)}
                    </div>
                    <div className="col-sm-6">
                      <strong>Fecha devolución:</strong>{' '}
                      {formatearFecha(alquilerSeleccionado.fecha_devolucion)}
                    </div>
                    <div className="col-sm-6">
                      <strong>Km inicial:</strong> {alquilerSeleccionado.kilometraje_inicial ?? '—'}{' '}
                      km
                    </div>
                    <div className="col-sm-6">
                      <strong>Km final:</strong> {alquilerSeleccionado.kilometraje_final ?? '—'} km
                    </div>
                    <div className="col-sm-6">
                      <strong>Combustible inicial:</strong>{' '}
                      {alquilerSeleccionado.combustible_inicial ?? '—'}%
                    </div>
                    <div className="col-sm-6">
                      <strong>Combustible final:</strong>{' '}
                      {alquilerSeleccionado.combustible_final ?? '—'}%
                    </div>
                    <div className="col-12">
                      <strong>Observaciones devolución:</strong>{' '}
                      {alquilerSeleccionado.observaciones_devolucion || 'Sin observaciones'}
                    </div>
                  </div>

                  <div className="row g-2 mb-3 p-3 bg-light rounded">
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Total final</small>
                      <strong>{formatearMonto(alquilerSeleccionado.total_final)}</strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Depósito</small>
                      <strong className="text-info">
                        {formatearMonto(alquilerSeleccionado.deposito_garantia)}
                      </strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Total pagado</small>
                      <strong className="text-success">
                        {formatearMonto(alquilerSeleccionado.total_pagado)}
                      </strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Saldo pendiente</small>
                      <strong
                        className={
                          Number(alquilerSeleccionado.saldo_pendiente ?? 0) > 0
                            ? 'text-danger'
                            : 'text-success'
                        }
                      >
                        {formatearMonto(alquilerSeleccionado.saldo_pendiente)}
                      </strong>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">Cargos adicionales</h6>
                  {alquilerSeleccionado.cargos_adicionales?.length > 0 ? (
                    <ul className="list-group mb-3">
                      {alquilerSeleccionado.cargos_adicionales.map((c) => (
                        <li
                          key={c.id}
                          className="list-group-item d-flex justify-content-between"
                        >
                          <span>
                            {c.tipo ? `[${c.tipo}] ` : ''}
                            {c.descripcion}
                          </span>
                          <strong>{formatearMonto(c.monto)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-secondary mb-3">Sin cargos adicionales.</p>
                  )}

                  <h6 className="fw-bold mb-3">Pagos registrados</h6>
                  {alquilerSeleccionado.pagos?.length > 0 ? (
                    <ul className="list-group">
                      {alquilerSeleccionado.pagos.map((p) => (
                        <li
                          key={p.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <span className="badge bg-secondary me-2">{p.tipo}</span>
                            <span>{p.metodo_pago}</span>
                            <small className="text-muted ms-2">
                              ({formatearFecha(p.fecha_pago)})
                            </small>
                          </div>
                          <strong className="text-success">{formatearMonto(p.monto)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-secondary mb-0">Sin pagos registrados.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAlquilerSeleccionado(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HistorialAlquileresPage;