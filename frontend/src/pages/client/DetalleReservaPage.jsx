import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { obtenerReserva, cancelarReserva, confirmarReserva } from '../../services/reservasService';
import { obtenerMensajeError } from '../../utils/manejarErrores';
import { formatearFecha, formatearBs, puedeCancelar } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import TimelineEstados from '../../components/reservas/TimelineEstados';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

const ETIQUETA_MODALIDAD = { HORA: 'por hora', DIA: 'por día', SEMANA: 'por semana', MES: 'por mes' };

export default function DetalleReservaPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esStaff = usuario.rol === 'EMPLEADO' || usuario.rol === 'ADMINISTRADOR';

  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cargar = async () => {
      try {
        const datos = await obtenerReserva(id);
        if (isMounted) setReserva(datos);
      
} catch (err) {
  if (isMounted) {
    setError(
      obtenerMensajeError(
        err,
        'No se pudo cargar la información de la reserva.'
      )
    );
  }
}
finally {
        if (isMounted) setCargando(false);
      }
    };
    cargar();
    return () => { isMounted = false; };
  }, [id]);

  
const ejecutar = async (accion, mensajeError) => {
  if (accionEnCurso || !reserva) return;

  setAccionEnCurso(true);
  setError('');

  try {
    const actualizada = await accion(reserva.id);

    setReserva((anterior) => ({
      ...anterior,
      ...actualizada
    }));

  } catch (err) {
    setError(
      obtenerMensajeError(err, mensajeError)
    );
  } finally {
    setAccionEnCurso(false);
  }
};


  const handleCancelar = () => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    ejecutar(cancelarReserva, 'No se pudo cancelar la reserva.');
  };

  const handleConfirmar = () => ejecutar(confirmarReserva, 'No se pudo confirmar la reserva.');

  const volverA = esStaff ? '/dashboard/reservas' : '/mis-reservas';

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px', maxWidth: '900px' }}>
        <Link to={volverA} className="text-decoration-none text-muted">
          ← Volver a {esStaff ? 'las reservas' : 'mis reservas'}
        </Link>

        {cargando && <p className="text-muted mt-3">Cargando reserva...</p>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {reserva && (
          <>
            <div className="d-flex justify-content-between align-items-center my-3">
              <h1 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>
                Reserva #{reserva.id}
              </h1>
              <EstadoBadge estado={reserva.estado} />
            </div>

            <div className="card p-4 mb-4">
              <h6 className="fw-bold text-muted text-uppercase mb-4" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                Estado de la reserva
              </h6>
              <TimelineEstados estado={reserva.estado} />
            </div>

            <div className="card p-4 mb-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Vehículo</div>
                  <div className="fw-semibold" style={{ color: 'var(--rc-text)' }}>
                    {reserva.vehiculo ? `${reserva.vehiculo.marca} ${reserva.vehiculo.modelo}` : '—'}
                  </div>
                </div>
                {esStaff && reserva.usuario && (
                  <div className="col-md-6">
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Cliente</div>
                    <div className="fw-semibold" style={{ color: 'var(--rc-text)' }}>{reserva.usuario.nombre}</div>
                  </div>
                )}
                <div className="col-md-6">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Recogida</div>
                  <div className="fw-semibold" style={{ color: 'var(--rc-text)' }}>{formatearFecha(reserva.fecha_inicio)}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Devolución</div>
                  <div className="fw-semibold" style={{ color: 'var(--rc-text)' }}>{formatearFecha(reserva.fecha_fin)}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Tarifa aplicada</div>
                  <div className="fw-semibold" style={{ color: 'var(--rc-text)' }}>
                    {formatearBs(reserva.precio_unitario)} {ETIQUETA_MODALIDAD[reserva.modalidad]}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total</div>
                  <div className="fs-4 fw-bold text-warning">{formatearBs(reserva.total)}</div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              {esStaff && reserva.estado === 'RESERVADA' && (
                <button className="btn btn-dark" onClick={handleConfirmar} disabled={accionEnCurso}>
                  Confirmar reserva
                </button>
              )}
              {puedeCancelar(reserva.estado) && (
                <button className="btn btn-outline-danger" onClick={handleCancelar} disabled={accionEnCurso}>
                  Cancelar reserva
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}