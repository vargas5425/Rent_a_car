import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import api from '../../services/api';
import { finalizarReserva as finalizarReservaService } from '../../services/reservasService';

function HistorialAlquileresPage() {
  const navigate = useNavigate();
  const [alquileres, setAlquileres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState(null);

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

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registrar';
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? 'Fecha inválida' : valor.toLocaleString('es-BO');
  };

  const formatearMonto = (monto) => `Bs ${Number(monto ?? 0).toFixed(2)}`;

  return (
    <div className="historial-alquileres-page">
      <Navbar />

      <main className="container py-4" style={{ marginTop: '80px' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Historial de alquileres</h2>
            <p className="text-secondary mb-0">Consulta los alquileres finalizados, cargos adicionales y estado de pagos.</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/dashboard/alquileres-activos" className="btn btn-outline-secondary">Alquileres activos</Link>
            <button type="button" className="btn btn-primary" onClick={cargarHistorial} disabled={cargando}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3">Cargando historial...</p>
          </div>
        ) : !error && alquileres.length === 0 ? (
          <div className="alert alert-info">No existen alquileres finalizados.</div>
        ) : !error && (
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Alquiler / Reserva</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Devolución</th>
                    <th>Total final</th>
                    <th>Total pagado</th>
                    <th>Saldo pendiente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alquileres.map((alquiler) => {
                    const saldo = Number(alquiler.saldo_pendiente ?? 0);
                    return (
                      <tr key={alquiler.id}>
                        <td>
                          <div className="fw-semibold">A-{alquiler.id}</div>
                          <small className="text-muted">R-{alquiler.reserva_id || 'N/A'}</small>
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
                        <td>{formatearFecha(alquiler.fecha_devolucion)}</td>
                        <td className="fw-bold">{formatearMonto(alquiler.total_final)}</td>
                        <td className="fw-semibold text-success">{formatearMonto(alquiler.total_pagado)}</td>
                        <td className={`fw-bold ${saldo > 0 ? 'text-danger' : 'text-success'}`}>
                          {formatearMonto(saldo)}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-info"
                              onClick={() => setAlquilerSeleccionado(alquiler)}
                            >
                              Detalles
                            </button>

                            {saldo > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => navigate(`/dashboard/alquileres/${alquiler.id}/pagos`)}
                              >
                                Registrar pago
                              </button>
                            )}

                            {alquiler.estado_reserva === 'DEVUELTA' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                disabled={saldo > 0}
                                title={saldo > 0 ? 'Debe cubrir el saldo pendiente antes de finalizar' : 'Finalizar reserva'}
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
        )}

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
                  <h5 className="modal-title fw-bold">Detalles del alquiler #{alquilerSeleccionado.id}</h5>
                  <button type="button" className="btn-close" onClick={() => setAlquilerSeleccionado(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-2 mb-3">
                    <div className="col-sm-6"><strong>Fecha entrega:</strong> {formatearFecha(alquilerSeleccionado.fecha_entrega)}</div>
                    <div className="col-sm-6"><strong>Fecha devolución:</strong> {formatearFecha(alquilerSeleccionado.fecha_devolucion)}</div>
                    <div className="col-sm-6"><strong>Km inicial:</strong> {alquilerSeleccionado.kilometraje_inicial ?? '—'} km</div>
                    <div className="col-sm-6"><strong>Km final:</strong> {alquilerSeleccionado.kilometraje_final ?? '—'} km</div>
                    <div className="col-sm-6"><strong>Combustible inicial:</strong> {alquilerSeleccionado.combustible_inicial ?? '—'}%</div>
                    <div className="col-sm-6"><strong>Combustible final:</strong> {alquilerSeleccionado.combustible_final ?? '—'}%</div>
                    <div className="col-12"><strong>Observaciones devolución:</strong> {alquilerSeleccionado.observaciones_devolucion || 'Sin observaciones'}</div>
                  </div>

                  <div className="row g-2 mb-3 p-3 bg-light rounded">
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Total final</small>
                      <strong>{formatearMonto(alquilerSeleccionado.total_final)}</strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Depósito</small>
                      <strong className="text-info">{formatearMonto(alquilerSeleccionado.deposito_garantia)}</strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Total pagado</small>
                      <strong className="text-success">{formatearMonto(alquilerSeleccionado.total_pagado)}</strong>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <small className="text-secondary d-block">Saldo pendiente</small>
                      <strong className={Number(alquilerSeleccionado.saldo_pendiente ?? 0) > 0 ? 'text-danger' : 'text-success'}>
                        {formatearMonto(alquilerSeleccionado.saldo_pendiente)}
                      </strong>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">Cargos adicionales</h6>
                  {alquilerSeleccionado.cargos_adicionales?.length > 0 ? (
                    <ul className="list-group mb-3">
                      {alquilerSeleccionado.cargos_adicionales.map((c) => (
                        <li key={c.id} className="list-group-item d-flex justify-content-between">
                          <span>{c.tipo ? `[${c.tipo}] ` : ''}{c.descripcion}</span>
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
                        <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-secondary me-2">{p.tipo}</span>
                            <span>{p.metodo_pago}</span>
                            <small className="text-muted ms-2">({formatearFecha(p.fecha_pago)})</small>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setAlquilerSeleccionado(null)}>Cerrar</button>
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