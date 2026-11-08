import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { crearReserva } from '../../services/reservasService';
import { aInputFecha, calcularTotal, formatearBs } from '../../utils/reservas';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

// Formulario de confirmación de reserva: el cliente revisa el auto, elige modalidad y fechas,
// ve el total estimado y confirma.
export default function NuevaReservaPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Si venimos del buscador, las fechas llegan en la URL (?inicio=...&fin=...)
  const [modalidad, setModalidad] = useState('HORA');
  const [inicio, setInicio] = useState(searchParams.get('inicio') || '');
  const [fin, setFin] = useState(searchParams.get('fin') || '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const cargarVehiculo = async () => {
      try {
        const res = await api.get('/vehiculos');
        if (!isMounted) return;
        const encontrado = res.data.find((v) => String(v.id) === String(id));
        if (encontrado) {
          setVehiculo(encontrado);
        } else {
          setErrorCarga('No encontramos ese vehículo.');
        }
      } catch (err) {
        if (isMounted) setErrorCarga(err.response?.data?.error || 'Error al cargar el vehículo.');
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    cargarVehiculo();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const precioUnitario = vehiculo ? (modalidad === 'DIA' ? vehiculo.precio_dia : vehiculo.precio_hora) : 0;
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
      // Ej.: 409 "El vehículo ya está reservado en ese horario"
      setError(err.response?.data?.error || 'No se pudo crear la reserva.');
    } finally {
      setEnviando(false);
    }
  };

  const minFecha = aInputFecha(new Date());

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px', maxWidth: '960px' }}>
        <Link to="/vehiculos" className="text-decoration-none text-muted">← Volver a la flota</Link>
        <h1 className="fw-bold my-3" style={{ color: 'var(--brand-primary, #0f172a)' }}>Confirmar reserva</h1>

        {cargando && <p className="text-muted">Cargando vehículo...</p>}
        {errorCarga && <div className="alert alert-danger">{errorCarga}</div>}

        {vehiculo && (
          <div className="row g-4">
            {/* Vehículo elegido */}
            <div className="col-md-5">
              <div className="card h-100">
                <img
                  src={vehiculo.imagen_url || 'https://via.placeholder.com/300x200?text=Auto'}
                  alt={vehiculo.modelo}
                  style={{ height: '220px', objectFit: 'cover', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                />
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-1">{vehiculo.marca} {vehiculo.modelo}</h4>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    {vehiculo.anio} • {vehiculo.transmision} • {vehiculo.pasajeros} pasajeros
                  </p>
                  <p className="mb-1">{formatearBs(vehiculo.precio_hora)} <span className="text-muted">por hora</span></p>
                  <p className="mb-0">{formatearBs(vehiculo.precio_dia)} <span className="text-muted">por día</span></p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="col-md-7">
              <form onSubmit={handleSubmit} className="card p-4" data-testid="form-reserva">
                {error && <div className="alert alert-danger" data-testid="reserva-error">{error}</div>}

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="modalidad">Cobrar por</label>
                  <select
                    id="modalidad"
                    className="form-select"
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    data-testid="select-modalidad"
                  >
                    <option value="HORA">Hora</option>
                    <option value="DIA">Día</option>
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" htmlFor="reserva-inicio">Recogida</label>
                    <input
                      id="reserva-inicio"
                      type="datetime-local"
                      className="form-control"
                      value={inicio}
                      min={minFecha}
                      onChange={(e) => setInicio(e.target.value)}
                      required
                      data-testid="reserva-fecha-inicio"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" htmlFor="reserva-fin">Devolución</label>
                    <input
                      id="reserva-fin"
                      type="datetime-local"
                      className="form-control"
                      value={fin}
                      min={inicio || minFecha}
                      onChange={(e) => setFin(e.target.value)}
                      required
                      data-testid="reserva-fecha-fin"
                    />
                  </div>
                </div>

                {/* Resumen del cobro */}
                <div className="rounded-3 p-3 mb-4" style={{ background: '#f1f5f9' }}>
                  {resumen ? (
                    <>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">
                          {resumen.unidades} {modalidad === 'DIA' ? (resumen.unidades === 1 ? 'día' : 'días') : (resumen.unidades === 1 ? 'hora' : 'horas')} × {formatearBs(precioUnitario)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <span className="fw-semibold">Total estimado</span>
                        <span className="fs-4 fw-bold" data-testid="reserva-total">{formatearBs(resumen.total)}</span>
                      </div>
                      <small className="text-muted">Cualquier fracción de tiempo se cobra como unidad completa.</small>
                    </>
                  ) : (
                    <span className="text-muted">Elige las fechas para ver el total.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 py-2"
                  disabled={enviando || vehiculo.estado === 'MANTENIMIENTO'}
                  data-testid="btn-confirmar-reserva"
                >
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
