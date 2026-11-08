import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { buscarDisponibles } from '../../services/reservasService';
import { aInputFecha, formatearBs, validarBusqueda } from '../../utils/reservas';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Búsqueda por fechas: mientras `busqueda` sea null se muestra toda la flota.
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [busqueda, setBusqueda] = useState(null); // { inicio, fin } de la última búsqueda
  const [disponibles, setDisponibles] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  useEffect(() => {
    let isMounted = true;

    const cargarVehiculos = async () => {
      try {
        const response = await api.get('/vehiculos');
        if (isMounted) {
          setVehiculos(response.data);
        }
      } catch (err) {
        if (isMounted) {
          const mensaje = err.response?.data?.error || 'Error al cargar los vehículos.';
          setError(mensaje);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarVehiculos();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBuscar = async (e) => {
    e.preventDefault();
    setErrorBusqueda('');

    const mensaje = validarBusqueda({ inicio, fin });
    if (mensaje) {
      setErrorBusqueda(mensaje);
      return;
    }

    setBuscando(true);
    try {
      const resultado = await buscarDisponibles(new Date(inicio).toISOString(), new Date(fin).toISOString());
      setDisponibles(resultado);
      setBusqueda({ inicio, fin });
    } catch (err) {
      setErrorBusqueda(err.response?.data?.error || 'No se pudo buscar disponibilidad.');
    } finally {
      setBuscando(false);
    }
  };

  const handleLimpiar = () => {
    setInicio('');
    setFin('');
    setBusqueda(null);
    setDisponibles(null);
    setErrorBusqueda('');
  };

  const lista = disponibles ?? vehiculos;
  const minFecha = aInputFecha(new Date());

  // Si el cliente ya buscó fechas, se las llevamos pre-cargadas al formulario de reserva.
  const enlaceReservar = (id) =>
    busqueda
      ? `/vehiculos/${id}/reservar?inicio=${encodeURIComponent(busqueda.inicio)}&fin=${encodeURIComponent(busqueda.fin)}`
      : `/vehiculos/${id}/reservar`;

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        {/* Cabecera */}
        <div className="mb-4 text-center">
          <h1 className="fw-bold mb-2" style={{ color: 'var(--brand-primary, #0f172a)' }}>Nuestra Flota</h1>
          <p className="text-muted">Elige el vehículo perfecto para tu próximo viaje.</p>
        </div>

        {/* Buscador por fechas */}
        {/* noValidate: así el navegador no bloquea el envío con su propio aviso (por el atributo min)
            y se muestran nuestros mensajes de validarBusqueda. */}
        <form onSubmit={handleBuscar} noValidate className="card p-4 mb-5" data-testid="form-busqueda">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="busqueda-inicio">Recogida</label>
              <input
                id="busqueda-inicio"
                type="datetime-local"
                className="form-control"
                value={inicio}
                min={minFecha}
                onChange={(e) => setInicio(e.target.value)}
                data-testid="input-fecha-inicio"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="busqueda-fin">Devolución</label>
              <input
                id="busqueda-fin"
                type="datetime-local"
                className="form-control"
                value={fin}
                min={inicio || minFecha}
                onChange={(e) => setFin(e.target.value)}
                data-testid="input-fecha-fin"
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-grow-1" disabled={buscando} data-testid="btn-buscar">
                {buscando ? 'Buscando...' : 'Buscar disponibles'}
              </button>
              {busqueda && (
                <button type="button" className="btn btn-outline-secondary" onClick={handleLimpiar}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
          {errorBusqueda && (
            <div className="alert alert-danger py-2 mt-3 mb-0" data-testid="busqueda-error">{errorBusqueda}</div>
          )}
        </form>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 text-muted">Cargando vehículos...</p>
          </div>
        )}

        {error && <div className="alert alert-danger rounded-3 shadow-sm">{error}</div>}

        {busqueda && (
          <p className="text-muted mb-4" data-testid="resumen-busqueda">
            {lista.length === 0
              ? 'No hay vehículos disponibles en ese horario. Prueba con otras fechas.'
              : `${lista.length} vehículo(s) disponible(s) en el horario elegido.`}
          </p>
        )}

        <div className="row g-4">
          {lista.map((auto) => (
            <div className="col-md-6 col-lg-4" key={auto.id} data-testid="vehiculo-card">
              <div className="card h-100">

                {/* Imagen y Badge de estado */}
                <div className="position-relative">
                  <img
                    src={auto.imagen_url || 'https://via.placeholder.com/300x200?text=Auto'}
                    className="card-img-top"
                    alt={auto.modelo}
                    style={{ height: '220px', objectFit: 'cover', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                  />
                  <span
                    className={`position-absolute badge rounded-pill ${
                      busqueda || auto.estado === 'DISPONIBLE' ? 'bg-success' :
                      auto.estado === 'ALQUILADA' ? 'bg-primary' :
                      'bg-warning text-dark'
                    }`}
                    style={{ top: '16px', right: '16px', padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    {busqueda ? 'DISPONIBLE EN TU HORARIO' : auto.estado}
                  </span>
                </div>

                {/* Información del vehículo */}
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-0">{auto.marca} {auto.modelo}</h5>
                    <span className="text-muted fw-semibold">{auto.anio}</span>
                  </div>

                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    {auto.categoria ? auto.categoria.nombre : 'N/A'} • {auto.transmision} • {auto.pasajeros} pasajeros
                  </p>

                  <div className="d-flex align-items-center text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    <span>📍 {auto.kilometraje_actual.toLocaleString()} km</span>
                  </div>

                  <p className="fw-semibold mb-4" style={{ fontSize: '0.9rem' }}>
                    {formatearBs(auto.precio_hora)} / hora · {formatearBs(auto.precio_dia)} / día
                  </p>

                  {auto.estado === 'MANTENIMIENTO' ? (
                    <button className="btn btn-outline-secondary w-100 py-2 mt-auto" disabled>
                      En mantenimiento
                    </button>
                  ) : (
                    <Link
                      to={enlaceReservar(auto.id)}
                      className="btn btn-dark w-100 py-2 mt-auto"
                      data-testid={`btn-reservar-${auto.id}`}
                    >
                      Reservar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
