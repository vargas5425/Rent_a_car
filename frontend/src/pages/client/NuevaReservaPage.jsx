import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { crearReserva } from '../../services/reservasService';
import { aInputFecha, calcularTotal, formatearBs } from '../../utils/reservas';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

export default function NuevaReservaPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [modalidad, setModalidad] = useState('HORA');
  const [inicio, setInicio] = useState(searchParams.get('inicio') || '');
  const [fin, setFin] = useState(searchParams.get('fin') || '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const cargarVehiculo = async () => {
      try {
        const res = await api.get('/vehiculos');
        if (!isMounted) return;
        const encontrado = res.data.find((v) => String(v.id) === String(id));
        if (encontrado) setVehiculo(encontrado);
        else setErrorCarga('No encontramos ese vehículo.');
      } catch (err) {
        if (isMounted) setErrorCarga(err.response?.data?.error || 'Error al cargar el vehículo.');
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargarVehiculo();
    return () => { isMounted = false; };
  }, [id]);

  // Función auxiliar para extraer precios de las tarifas
  const obtenerPrecio = (vehiculo, modalidad) => {
    if (!vehiculo || !vehiculo.tarifas) return 0;
    const tarifa = vehiculo.tarifas.find(t => t.modalidad === modalidad);
    return tarifa ? Number(tarifa.precio) : 0;
  };

  const precioHora = vehiculo ? obtenerPrecio(vehiculo, 'HORA') : 0;
  const precioDia = vehiculo ? obtenerPrecio(vehiculo, 'DIA') : 0;

  const resumenHora = precioHora > 0
    ? calcularTotal({ fechaInicio: inicio, fechaFin: fin, modalidad: 'HORA', precioUnitario: precioHora })
    : null;

  const tieneTarifaDia = precioDia > 0;
  const superaOCuestaIgualQueDia = Boolean(
    resumenHora && tieneTarifaDia && resumenHora.total >= precioDia
  );

  // Si hay tarifa por día y el total por hora es menor al costo diario, conviene cobrar por hora.
  // Si el total por hora iguala o supera el costo diario, se habilita la opción Día.
  const bloquearDiaPorMenorCosto = Boolean(
    resumenHora && tieneTarifaDia && !superaOCuestaIgualQueDia
  );

  useEffect(() => {
    if (!resumenHora || !tieneTarifaDia) return;

    if (bloquearDiaPorMenorCosto && modalidad === 'DIA') {
      setModalidad('HORA');
    } else if (superaOCuestaIgualQueDia && modalidad === 'HORA') {
      setModalidad('DIA');
    }
  }, [resumenHora, tieneTarifaDia, bloquearDiaPorMenorCosto, superaOCuestaIgualQueDia, modalidad]);

  const precioUnitario = vehiculo ? obtenerPrecio(vehiculo, modalidad) : 0;
  const resumen = calcularTotal({ fechaInicio: inicio, fechaFin: fin, modalidad, precioUnitario });
  const enElPasado = inicio && new Date(inicio).getTime() < Date.now();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resumen) {
      setError('Revisa las fechas: la devolución debe ser posterior a la recogida.');
      return;
    }
    if (enElPasado) {
      setError('No se puede reservar en el pasado.');
      return;
    }

    setEnviando(true);
    try {
      const reserva = await crearReserva({
        vehiculoId: Number(id),
        fechaInicio: new Date(inicio).toISOString(),
        fechaFin: new Date(fin).toISOString(),
        modalidad
      });
      navigate(`/reservas/${reserva.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la reserva.');
    } finally {
      setEnviando(false);
    }
  };

  const minFecha = aInputFecha(new Date());

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px', maxWidth: '960px' }}>
        <div className="mb-3">
          <Link
            to="/vehiculos"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium"
            style={{
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)',
              backgroundColor: 'var(--rc-card)'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            <span>Volver a la flota</span>
          </Link>
        </div>

        <h1 className="fw-bold my-3" style={{ color: 'var(--rc-text)' }}>Confirmar reserva</h1>

        {cargando && <p className="text-muted">Cargando vehículo...</p>}
        {errorCarga && <div className="alert alert-danger">{errorCarga}</div>}

        {vehiculo && (
          <div className="row g-4">
            <div className="col-md-5">
              <div className="card h-100">
                <img
                  src={obtenerUrlImagen(vehiculo.imagen_url)}
                  alt={vehiculo.modelo}
                  style={{ height: '220px', objectFit: 'cover', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                />
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>{vehiculo.marca} {vehiculo.modelo}</h5>
                    <span className="text-muted fw-semibold">{vehiculo.anio}</span>
                  </div>
                  
                  <div className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    <p className="mb-1" style={{ color: 'var(--rc-text)' }}>
                      <i className="fa fa-check-square-o me-1" aria-hidden="true"></i> {vehiculo.transmision}
                    </p>
                    <p className="mb-1" style={{ color: 'var(--rc-text)' }}>
                      <i className="fa fa-check-square-o me-1" aria-hidden="true"></i> {vehiculo.pasajeros} pasajeros
                    </p>
                  </div>
                  {/* MOSTRAR PRECIOS DESDE TARIFAS */}
                  {precioHora > 0 && (
                    <p className="mb-1" style={{ color: 'var(--rc-text)' }}>{formatearBs(precioHora)} <span className="text-muted">por hora</span></p>
                  )}
                  {precioDia > 0 && (
                    <p className="mb-0" style={{ color: 'var(--rc-text)' }}>{formatearBs(precioDia)} <span className="text-muted">por día</span></p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-7">
              <form onSubmit={handleSubmit} className="card p-4 text-start">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3 w-100">
                  <label className="form-label fw-semibold d-block text-start" style={{ color: 'var(--rc-text)' }}>Cobrar por</label>
                  <select
                    className="form-select w-100 text-start"
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      backgroundColor: 'var(--rc-card)',
                      color: 'var(--rc-text)',
                      borderColor: 'var(--rc-border)'
                    }}
                  >
                    {precioHora > 0 && <option value="HORA">Hora</option>}
                    {precioDia > 0 && <option value="DIA" disabled={bloquearDiaPorMenorCosto}>Día</option>}
                  </select>

                  {bloquearDiaPorMenorCosto && (
                    <small className="text-muted mt-1 d-block fw-semibold">
                      El cobro por hora ({formatearBs(resumenHora.total)}) es menor a la tarifa diaria ({formatearBs(precioDia)}): conviene cobrar por hora.
                    </small>
                  )}

                  {superaOCuestaIgualQueDia && (
                    <small className="text-success mt-1 d-block fw-semibold">
                      El cobro por hora ({formatearBs(resumenHora.total)}) iguala o supera la tarifa diaria ({formatearBs(precioDia)}): modalidad Día habilitada.
                    </small>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold d-block text-start" style={{ color: 'var(--rc-text)' }}>Recogida</label>
                    <input
                      type="datetime-local"
                      className="form-control w-100"
                      value={inicio}
                      min={minFecha}
                      onChange={(e) => setInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold d-block text-start" style={{ color: 'var(--rc-text)' }}>Devolución</label>
                    <input
                      type="datetime-local"
                      className="form-control w-100"
                      value={fin}
                      min={inicio || minFecha}
                      onChange={(e) => setFin(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-3 p-3 mb-4 w-100" style={{ background: 'var(--rc-bg-alt)' }}>
                  {resumen ? (
                    <>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">
                          {resumen.unidades} {modalidad === 'DIA' ? (resumen.unidades === 1 ? 'día' : 'días') : (resumen.unidades === 1 ? 'hora' : 'horas')} × {formatearBs(precioUnitario)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <span className="fw-semibold" style={{ color: 'var(--rc-text)' }}>Total estimado</span>
                        <span className="fs-4 fw-bold text-warning">{formatearBs(resumen.total)}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted">Elige las fechas para ver el total.</span>
                  )}
                </div>

                <button type="submit" className="btn btn-dark w-100 py-2" disabled={enviando || vehiculo.estado === 'MANTENIMIENTO'}>
                  {enviando ? 'Reservando...' : 'Confirmar reserva'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}