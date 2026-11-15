import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  listarTodasLasReservas,
  confirmarReserva,
  cancelarReserva,
  crearAlquilerDesdeReserva
} from '../../services/reservasService';
import { ESTADOS_RESERVA, ETIQUETA_ESTADO, formatearFecha, formatearBs, puedeCancelar } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import { obtenerMensajeError } from '../../utils/manejarErrores';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function GestionReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');
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

      if (isMounted) {
        setReservas(datos);
      }
    } catch (err) {
      if (isMounted) {
        setError(
          obtenerMensajeError(
            err,
            'No se pudieron cargar las reservas.'
          )
        );
      }
    } finally {
      if (isMounted) {
        setCargando(false);
      }
    }
  };

  cargar();

  return () => {
    isMounted = false;
  };
}, [recarga]);


  
  const ejecutar = async (accion, id, mensajeError) => {
    if (accionEnCurso !== null) return;

    setAccionEnCurso(id);
    setError('');

    try {
      await accion(id);

      // Actualizar la tabla después de completar la operación
      setRecarga((n) => n + 1);

    } catch (err) {
      setError(
        obtenerMensajeError(err, mensajeError)
      );
    } finally {
      setAccionEnCurso(null);
    }
  };


  const handleCrearAlquiler = async (reservaId) => {
    const confirmar = window.confirm(
      `¿Deseas crear un alquiler para la reserva #${reservaId}?`
    );

    if (!confirmar) return;

    try {
      setError('');

      const alquiler = await crearAlquilerDesdeReserva(reservaId);

      window.alert(
        `Alquiler #${alquiler.id} creado correctamente. Ya está pendiente de entrega.`
      );

      setRecarga((n) => n + 1);
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No se pudo crear el alquiler.'
        )
      );
    }
  };


  const handleCancelar = (id) => {
    if (window.confirm('¿Seguro que deseas cancelar esta reserva?')) {
      ejecutar(cancelarReserva, id, 'No se pudo cancelar la reserva.');
    }
  };

  const visibles = filtro === 'TODAS' ? reservas : reservas.filter((r) => r.estado === filtro);

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Link to="/dashboard" className="text-decoration-none text-muted">← Volver al Dashboard</Link>
            <h2 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>Gestión de Reservas</h2>
          </div>
          
          <select
            className="form-select w-auto"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ backgroundColor: 'var(--rc-card)', color: 'var(--rc-text)', borderColor: 'var(--rc-border)' }}
          >
            <option value="TODAS">Todos los estados</option>
            {[...ESTADOS_RESERVA, 'CANCELADA'].map((estado) => (
              <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {cargando && <p className="text-muted">Cargando reservas...</p>}

        <div className="table-responsive shadow-sm rounded" style={{ backgroundColor: 'var(--rc-card)' }}>
          <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Recogida</th>
                <th>Devolución</th>
                <th>Total</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            
            <tbody>
              {!cargando && !error && visibles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No hay reservas para mostrar.
                  </td>
                </tr>
              ) : !cargando && !error ? (
                visibles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.id}</strong>
                    </td>

                    <td>{r.usuario ? r.usuario.nombre : '—'}</td>

                    <td>
                      {r.vehiculo
                        ? `${r.vehiculo.marca} ${r.vehiculo.modelo}`
                        : '—'}
                    </td>

                    <td>{formatearFecha(r.fecha_inicio)}</td>

                    <td>{formatearFecha(r.fecha_fin)}</td>

                    <td>{formatearBs(r.total)}</td>

                    <td>
                      <EstadoBadge estado={r.estado} />
                    </td>

                    <td className="text-center text-nowrap">
                      <Link
                        to={`/reservas/${r.id}`}
                        className="btn btn-sm btn-outline-dark me-2"
                      >
                        Ver
                      </Link>

                      {r.estado === 'RESERVADA' && (
                        <button
                          className="btn btn-sm btn-dark me-2"
                          onClick={() =>
                            ejecutar(
                              confirmarReserva,
                              r.id,
                              'No se pudo confirmar la reserva.'
                            )
                          }
                          disabled={accionEnCurso !== null}
                        >
                          {accionEnCurso === r.id
                            ? 'Procesando...'
                            : 'Confirmar'}
                        </button>
                      )}

                      {r.estado === 'CONFIRMADA' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleCrearAlquiler(r.id)}
                        >
                          Crear alquiler
                        </button>
                      )}

                      {puedeCancelar(r.estado) && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancelar(r.id)}
                          disabled={accionEnCurso !== null}
                        >
                          {accionEnCurso === r.id
                            ? 'Procesando...'
                            : 'Cancelar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}