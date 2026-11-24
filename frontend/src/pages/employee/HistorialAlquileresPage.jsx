import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import api from '../../services/api';
import { finalizarReserva as finalizarReservaService } from '../../services/reservasService';

function HistorialAlquileresPage() {
  const [alquileres, setAlquileres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState(null);

  const finalizarReserva = async (reservaId) => {
    if (!reservaId) {
      alert('Este alquiler no tiene una reserva asociada.');
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
            <p className="text-secondary mb-0">Consulta los alquileres finalizados y sus cargos adicionales.</p>
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alquileres.map((alquiler) => (
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
                      <td className="fw-bold text-success">{formatearMonto(alquiler.total_final)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info me-2"
                          onClick={() => setAlquilerSeleccionado(alquiler)}
                        >
                          Detalles
                        </button>

                        {alquiler.estado_reserva === 'DEVUELTA' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => finalizarReserva(alquiler.reserva_id)}
                          >
                            Finalizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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

                  <h6 className="fw-bold mb-3">Cargos adicionales</h6>
                  {alquilerSeleccionado.cargos_adicionales?.length > 0 ? (
                    <ul className="list-group">
                      {alquilerSeleccionado.cargos_adicionales.map((c) => (
                        <li key={c.id} className="list-group-item d-flex justify-content-between">
                          <span>{c.tipo ? `[${c.tipo}] ` : ''}{c.descripcion}</span>
                          <strong>{formatearMonto(c.monto)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-secondary">Sin cargos adicionales.</p>
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