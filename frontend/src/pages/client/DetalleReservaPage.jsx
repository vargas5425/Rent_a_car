import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  obtenerReserva,
  cancelarReserva,
  confirmarReserva,
  finalizarReserva
} from '../../services/reservasService';
import { formatearFecha, formatearBs, puedeCancelar, calcularTotal } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import TimelineEstados from '../../components/reservas/TimelineEstados';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

const ETIQUETA_MODALIDAD = { HORA: 'por hora', DIA: 'por día', SEMANA: 'por semana', MES: 'por mes' };

function extraerCargos(reserva) {
  if (!reserva) return [];
  const items = [];

  const listaCargos = Array.isArray(reserva.alquiler?.cargos)
    ? reserva.alquiler.cargos
    : Array.isArray(reserva.cargos)
    ? reserva.cargos
    : [];

  for (const c of listaCargos) {
    const monto = Number(c.monto ?? c.total ?? c.valor ?? 0);
    if (Number.isFinite(monto) && monto > 0) {
      const prefijoTipo = c.tipo ? `[${c.tipo}] ` : '';
      const textoBase = c.descripcion || c.concepto || c.motivo || 'Cargo adicional';
      items.push({
        concepto: `${prefijoTipo}${textoBase}`.trim(),
        detalle: c.observacion || c.detalle || '',
        monto
      });
    }
  }

  return items;
}

export default function DetalleReservaPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esStaff = usuario?.rol === 'EMPLEADO' || usuario?.rol === 'ADMINISTRADOR';

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
        if (isMounted) setError(err.response?.data?.error || 'Error al cargar la reserva.');
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargar();
    return () => { isMounted = false; };
  }, [id]);

  const ejecutar = async (accion, mensajeError) => {
    setAccionEnCurso(true);
    setError('');
    try {
      const actualizada = await accion(reserva.id);
      setReserva((anterior) => ({ ...anterior, ...actualizada }));
    } catch (err) {
      setError(err.response?.data?.error || mensajeError);
    } finally {
      setAccionEnCurso(false);
    }
  };

  const handleCancelar = () => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    ejecutar(cancelarReserva, 'No se pudo cancelar la reserva.');
  };

  const handleConfirmar = () => ejecutar(confirmarReserva, 'No se pudo confirmar la reserva.');

  const handleFinalizar = () => {
    if (!window.confirm('¿Confirmas finalizar esta reserva?')) return;
    ejecutar(finalizarReserva, 'No se pudo finalizar la reserva.');
  };

  const volverA = esStaff ? '/dashboard/reservas' : '/mis-reservas';

  const desglose = useMemo(() => {
    if (!reserva) return null;

    const alquiler = reserva.alquiler || null;
    const calculoBase = calcularTotal({
      fechaInicio: reserva.fecha_inicio,
      fechaFin: reserva.fecha_fin,
      modalidad: reserva.modalidad,
      precioUnitario: reserva.precio_unitario
    });

    const cargosLista = extraerCargos(reserva);
    const sumaCargos = cargosLista.reduce((acc, c) => acc + c.monto, 0);

    const subtotalBase = calculoBase
      ? calculoBase.total
      : alquiler?.monto_total != null
      ? Math.max(0, Number(alquiler.monto_total) - sumaCargos)
      : Number(reserva.total || 0);

    const diferenciaSinDetalle =
      alquiler?.monto_total != null
        ? Number((Number(alquiler.monto_total) - subtotalBase - sumaCargos).toFixed(2))
        : 0;

    const cargosFinales = [...cargosLista];
    if (diferenciaSinDetalle > 0.009) {
      cargosFinales.push({
        concepto: 'Otros cargos adicionales del alquiler',
        detalle: '',
        monto: diferenciaSinDetalle
      });
    }

    const totalCargos = cargosFinales.reduce((acc, c) => acc + c.monto, 0);
    const totalFinal =
      alquiler?.monto_total != null && Number(alquiler.monto_total) > 0
        ? Number(alquiler.monto_total)
        : Number(reserva.total || subtotalBase + totalCargos);

    const pagosLista = Array.isArray(alquiler?.pagos) ? alquiler.pagos : [];
    const totalPagado = pagosLista.reduce((acc, p) => acc + Number(p.monto ?? p.total ?? 0), 0);
    const deposito = alquiler?.deposito_garantia != null ? Number(alquiler.deposito_garantia) : null;

    return {
      alquiler,
      calculoBase,
      subtotalBase,
      cargosFinales,
      totalCargos,
      totalFinal,
      pagosLista,
      totalPagado,
      deposito
    };
  }, [reserva]);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px', maxWidth: '900px' }}>
        <div className="mb-3">
          <Link
            to={volverA}
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium"
            style={{
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)',
              backgroundColor: 'var(--rc-card)'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            <span>Volver a {esStaff ? 'las reservas' : 'mis reservas'}</span>
          </Link>
        </div>

        {cargando && <p className="text-muted mt-3">Cargando reserva...</p>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {reserva && desglose && (
          <>
            <div className="d-flex justify-content-between align-items-center my-3">
              <h1 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>
                Reserva R-{reserva.id}
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
                  {reserva.vehiculo?.placa && (
                    <small className="text-muted">Placa: {reserva.vehiculo.placa}</small>
                  )}
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
              </div>

              <hr className="my-4" style={{ borderColor: 'var(--rc-border)' }} />

              <h6
                className="fw-bold text-muted text-uppercase mb-3"
                style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
              >
                Detalle del cobro
              </h6>

              <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                <div>
                  <span style={{ color: 'var(--rc-text)' }}>Alquiler base</span>
                  {desglose.calculoBase && (
                    <small className="text-muted ms-2">
                      ({desglose.calculoBase.unidades}{' '}
                      {reserva.modalidad === 'DIA'
                        ? desglose.calculoBase.unidades === 1
                          ? 'día'
                          : 'días'
                        : desglose.calculoBase.unidades === 1
                        ? 'hora'
                        : 'horas'}{' '}
                      × {formatearBs(reserva.precio_unitario)})
                    </small>
                  )}
                </div>
                <span className="fw-semibold text-nowrap" style={{ color: 'var(--rc-text)' }}>
                  {formatearBs(desglose.subtotalBase)}
                </span>
              </div>

              {desglose.cargosFinales.length > 0 ? (
                <div className="my-3">
                  <div className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    Cargos adicionales
                  </div>
                  {desglose.cargosFinales.map((cargo, idx) => (
                    <div
                      key={`${cargo.concepto}-${idx}`}
                      className="d-flex justify-content-between align-items-start gap-3 py-2 px-3 rounded-3 mb-2"
                      style={{ backgroundColor: 'var(--rc-bg-alt)' }}
                    >
                      <div>
                        <div className="fw-semibold text-danger" style={{ fontSize: '0.92rem' }}>
                          {cargo.concepto}
                        </div>
                        {cargo.detalle && (
                          <small className="text-muted d-block">{cargo.detalle}</small>
                        )}
                      </div>
                      <span className="fw-bold text-danger text-nowrap">
                        +{formatearBs(cargo.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                  <span className="text-muted">Cargos adicionales (retraso, combustible, daños)</span>
                  <span className="text-muted text-nowrap">{formatearBs(0)}</span>
                </div>
              )}

              {desglose.pagosLista.length > 0 && (
                <div className="my-3">
                  <div className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    Pagos registrados
                  </div>
                  {desglose.pagosLista.map((pago, idx) => (
                    <div
                      key={pago.id ?? idx}
                      className="d-flex justify-content-between align-items-center gap-3 py-2 px-3 rounded-3 mb-2"
                      style={{ backgroundColor: 'var(--rc-bg-alt)' }}
                    >
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        {pago.tipo && (
                          <span className="badge bg-secondary">{pago.tipo}</span>
                        )}
                        <span className="fw-semibold" style={{ color: 'var(--rc-text)', fontSize: '0.9rem' }}>
                          {pago.metodo || 'PAGO'}
                        </span>
                        {(pago.fecha || pago.createdAt) && (
                          <small className="text-muted">
                            ({formatearFecha(pago.fecha || pago.createdAt)})
                          </small>
                        )}
                      </div>
                      <span className="fw-bold text-success text-nowrap">
                        {formatearBs(pago.monto ?? pago.total ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {desglose.deposito !== null && (
                <div className="mb-3 pt-1">
                  <small className="text-muted d-block">Depósito garantía</small>
                  <span className="fw-semibold text-nowrap" style={{ color: 'var(--rc-text)' }}>
                    {formatearBs(desglose.deposito)}
                  </span>
                </div>
              )}

              <div
                className="d-flex justify-content-between align-items-center gap-3 pt-3 border-top"
                style={{ borderColor: 'var(--rc-border)' }}
              >
                <span className="fw-bold fs-6" style={{ color: 'var(--rc-text)' }}>Total</span>
                <span className="fs-4 fw-bold text-warning text-nowrap">
                  {formatearBs(desglose.totalFinal)}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              {esStaff && reserva.estado === 'RESERVADA' && (
                <button className="btn btn-dark" onClick={handleConfirmar} disabled={accionEnCurso}>
                  Confirmar reserva
                </button>
              )}
              {esStaff && reserva.estado === 'DEVUELTA' && (
                <button className="btn btn-success" onClick={handleFinalizar} disabled={accionEnCurso}>
                  {accionEnCurso ? 'Finalizando...' : 'Finalizar reserva'}
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