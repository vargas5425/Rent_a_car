
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

  const confirmar = window.confirm(
    `¿Estás seguro de finalizar la reserva #${reservaId}?`
  );

  if (!confirmar) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('No se encontró una sesión activa.');
      return;
    }

    await axios.patch(
      `${API_URL}/reservas/${reservaId}/finalizar`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert('Reserva finalizada correctamente.');

    await cargarHistorial();

  } catch (err) {
    console.error('Error al finalizar reserva:', err);

    alert(
      err.response?.data?.error ||
      err.response?.data?.mensaje ||
      'No se pudo finalizar la reserva.'
    );
  }
};

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      setError('');

      const token = localStorage.getItem('token');

      if (!token) {
        setError('No se encontró una sesión activa.');
        return;
      }

      const respuesta = await axios.get(
        `${API_URL}/alquileres/historial`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAlquileres(respuesta.data.alquileres || []);

    } catch (err) {
      console.error('Error al cargar historial:', err);

      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        'No se pudo cargar el historial de alquileres.'
      );

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

    return Number.isNaN(valor.getTime())
      ? 'Fecha inválida'
      : valor.toLocaleString('es-BO');
  };

  const formatearMonto = (monto) => {
    return `Bs ${Number(monto ?? 0).toFixed(2)}`;
  };

  const verDetalles = (alquiler) => {
    setAlquilerSeleccionado(alquiler);
  };

  const cerrarDetalles = () => {
    setAlquilerSeleccionado(null);
  };

  return (
    <main className="container py-4">

      {/* ENCABEZADO */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Historial de alquileres
          </h2>

          <p className="text-secondary mb-0">
            Consulta los alquileres finalizados y sus cargos adicionales.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/dashboard/alquileres-activos"
            className="btn btn-outline-secondary"
          >
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

      {/* RESUMEN */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <p className="text-secondary mb-1">
            Total de alquileres finalizados
          </p>

          <h2 className="fw-bold mb-0">
            {alquileres.length}
          </h2>
        </div>
      </div>

      {/* ERRORES */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* CARGANDO */}
      {cargando ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
          />
          <p className="mt-3">Cargando historial...</p>
        </div>

      ) : !error && alquileres.length === 0 ? (
        <div className="alert alert-info">
          No existen alquileres finalizados.
        </div>

      ) : !error && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Alquiler</th>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Fecha de entrega</th>
                  <th>Fecha de devolución</th>
                  <th>Monto alquiler</th>
                  <th>Cargos adicionales</th>
                  <th>Total final</th>
                  <th>Estado</th>
                  <th>Estado reserva</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {alquileres.map((alquiler) => (
                  <tr key={alquiler.id}>

                    <td>#{alquiler.id}</td>

                    <td>
                      {alquiler.reserva_id
                        ? `#${alquiler.reserva_id}`
                        : 'Sin reserva'}
                    </td>

                    <td>#{alquiler.usuario_id}</td>

                    <td>#{alquiler.vehiculo_id}</td>

                    <td>
                      {formatearFecha(alquiler.fecha_entrega)}
                    </td>

                    <td>
                      {formatearFecha(alquiler.fecha_devolucion)}
                    </td>

                    <td>
                      {formatearMonto(
                        alquiler.monto_alquiler ?? alquiler.monto_total
                      )}
                    </td>

                    <td>
                      {formatearMonto(alquiler.total_cargos)}
                    </td>

                    <td className="fw-bold text-success">
                      {formatearMonto(alquiler.total_final)}
                    </td>

                    {/* Estado del alquiler */}
                    <td>
                    <span className="badge bg-secondary">
                        {alquiler.estado}
                    </span>
                    </td>

                    {/* Estado de la reserva */}
                    <td>
                    <span
                        className={`badge ${
                        alquiler.estado_reserva === 'FINALIZADA'
                            ? 'bg-success'
                            : alquiler.estado_reserva === 'DEVUELTA'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                    >
                        {alquiler.estado_reserva || 'Sin reserva'}
                    </span>
                    </td>

                    {/* Acciones */}
                    <td>
                    <div className="d-flex gap-2">

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => verDetalles(alquiler)}
                        >
                          Ver detalles
                        </button>

                        <Link
                          to={`/dashboard/alquileres/${alquiler.id}/cargos-adicionales`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Agregar cargo
                        </Link>

                        {alquiler.estado_reserva === 'DEVUELTA' && (
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => finalizarReserva(alquiler.reserva_id)}
                            >
                                Finalizar reserva
                            </button>
                            )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* DETALLES DEL ALQUILER */}
      {alquilerSeleccionado && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalles del alquiler ${alquilerSeleccionado.id}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={cerrarDetalles}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Detalles del alquiler #{alquilerSeleccionado.id}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={cerrarDetalles}
                />
              </div>

              <div className="modal-body">

                <h6 className="fw-bold mb-3">
                  Información general
                </h6>

                <p>
                  <strong>Reserva:</strong>{' '}
                  #{alquilerSeleccionado.reserva_id ?? 'Sin reserva'}
                </p>

                <p>
                  <strong>Cliente:</strong>{' '}
                  #{alquilerSeleccionado.usuario_id}
                </p>

                <p>
                  <strong>Vehículo:</strong>{' '}
                  #{alquilerSeleccionado.vehiculo_id}
                </p>

                <p>
                  <strong>Modalidad:</strong>{' '}
                  {alquilerSeleccionado.modalidad || 'No registrada'}
                </p>

                <p>
                  <strong>Fecha de entrega:</strong>{' '}
                  {formatearFecha(alquilerSeleccionado.fecha_entrega)}
                </p>

                <p>
                  <strong>Fecha de devolución:</strong>{' '}
                  {formatearFecha(alquilerSeleccionado.fecha_devolucion)}
                </p>

                <hr />

                <h6 className="fw-bold mb-3">
                  Estado del vehículo
                </h6>

                <p>
                  <strong>Kilometraje inicial:</strong>{' '}
                  {alquilerSeleccionado.kilometraje_inicial ?? 'Sin registrar'} km
                </p>

                <p>
                  <strong>Kilometraje final:</strong>{' '}
                  {alquilerSeleccionado.kilometraje_final ?? 'Sin registrar'} km
                </p>

                <p>
                  <strong>Combustible inicial:</strong>{' '}
                  {alquilerSeleccionado.combustible_inicial ?? 'Sin registrar'}%
                </p>

                <p>
                  <strong>Combustible final:</strong>{' '}
                  {alquilerSeleccionado.combustible_final ?? 'Sin registrar'}%
                </p>

                <p>
                  <strong>Observaciones:</strong>{' '}
                  {alquilerSeleccionado.observaciones_devolucion ||
                    'Sin observaciones'}
                </p>

                <hr />

                <h6 className="fw-bold mb-3">
                  Cargos adicionales
                </h6>

                {alquilerSeleccionado.cargos_adicionales?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Monto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alquilerSeleccionado.cargos_adicionales.map(
                          (cargo) => (
                            <tr key={cargo.id}>
                              <td>{cargo.tipo}</td>
                              <td>{cargo.descripcion}</td>
                              <td>{formatearMonto(cargo.monto)}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-secondary">
                    Este alquiler no tiene cargos adicionales.
                  </p>
                )}

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span>Monto del alquiler:</span>
                  <strong>
                    {formatearMonto(
                      alquilerSeleccionado.monto_alquiler ??
                      alquilerSeleccionado.monto_total
                    )}
                  </strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Cargos adicionales:</span>
                  <strong>
                    {formatearMonto(alquilerSeleccionado.total_cargos)}
                  </strong>
                </div>

                <div className="d-flex justify-content-between border-top pt-3">
                  <h5 className="fw-bold">Total final:</h5>

                  <h5 className="fw-bold text-success">
                    {formatearMonto(alquilerSeleccionado.total_final)}
                  </h5>
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarDetalles}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default HistorialAlquileresPage;
