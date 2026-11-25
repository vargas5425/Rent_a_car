import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { buscarDisponibles } from '../../services/reservasService';
import { validarBusqueda, formatearBs } from '../../utils/reservas';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

const VEHICULOS_POR_PAGINA = 6;

const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const generarFechaHoraDefault = (diasExtra = 0) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasExtra);
  fecha.setHours(12, 0, 0, 0);
  const fechaStr = getLocalDateString(fecha);
  return `${fechaStr}T12:00`;
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inicio, setInicio] = useState(() => generarFechaHoraDefault(0));
  const [fin, setFin] = useState(() => generarFechaHoraDefault(1));
  
  const [busqueda, setBusqueda] = useState(null);
  const [disponibles, setDisponibles] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const cargarVehiculos = async () => {
      try {
        const response = await api.get('/vehiculos');
        if (isMounted) setVehiculos(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || 'Error al cargar los vehículos.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    cargarVehiculos();
    return () => { isMounted = false; };
  }, []);

  const actualizarFechaHora = (fecha, hora, tipo) => {
    const setter = tipo === 'inicio' ? setInicio : setFin;
    if (!fecha) {
      setter('');
      return;
    }
    const horaFinal = hora || '12:00'; 
    setter(`${fecha}T${horaFinal}`);
  };

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
      setDisponibles(Array.isArray(resultado) ? resultado : []);
      setBusqueda({ inicio, fin });
      setPaginaActual(1);
    } catch (err) {
      setErrorBusqueda(err.response?.data?.error || 'No se pudo buscar disponibilidad.');
    } finally {
      setBuscando(false);
    }
  };

  const handleLimpiar = () => {
    setInicio(generarFechaHoraDefault(0));
    setFin(generarFechaHoraDefault(1));
    setBusqueda(null);
    setDisponibles(null);
    setErrorBusqueda('');
    setPaginaActual(1);
  };

  const lista = disponibles ?? vehiculos;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / VEHICULOS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const listaPaginada = useMemo(() => {
    const inicioIdx = (paginaSegura - 1) * VEHICULOS_POR_PAGINA;
    return lista.slice(inicioIdx, inicioIdx + VEHICULOS_POR_PAGINA);
  }, [lista, paginaSegura]);

  const cambiarPagina = (nuevaPagina) => {
    const clamped = Math.max(1, Math.min(totalPaginas, nuevaPagina));
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const minFecha = getLocalDateString(new Date());
  
  const enlaceReservar = (id) =>
    busqueda
      ? `/vehiculos/${id}/reservar?inicio=${encodeURIComponent(busqueda.inicio)}&fin=${encodeURIComponent(busqueda.fin)}`
      : `/vehiculos/${id}/reservar`;

  const inicioFecha = inicio ? inicio.split('T')[0] : '';
  const inicioHora = inicio ? inicio.split('T')[1] : '';
  const finFecha = fin ? fin.split('T')[0] : '';
  const finHora = fin ? fin.split('T')[1] : '';

  const inputStyle = { borderRight: 'none', borderTopRightRadius: '0', borderBottomRightRadius: '0', minWidth: '130px' };
  const inputTimeStyle = { borderTopLeftRadius: '0', borderBottomLeftRadius: '0', width: '115px', flex: 'none', paddingLeft: '10px', paddingRight: '5px' };

  const obtenerPrecio = (vehiculo, modalidad) => {
    if (!vehiculo || !vehiculo.tarifas) return null;
    const tarifa = vehiculo.tarifas.find(t => t.modalidad === modalidad);
    return tarifa ? Number(tarifa.precio) : null;
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator { display: none; }
        input[type="time"] { text-align: center; }
      `}</style>

      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        <div className="mb-4 text-center">
          <h1 className="fw-bold mb-2" style={{ color: 'var(--rc-text)' }}>Nuestra Flota</h1>
          <p className="text-muted">Elige el vehículo perfecto para tu próximo viaje.</p>
        </div>

        <form onSubmit={handleBuscar} noValidate className="card p-4 mb-5">
          <div className="row g-3 justify-content-center align-items-end">
            <div className="col-md-4 col-lg-4">
              <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>Fecha y hora de recogida</label>
              <div className="input-group flex-nowrap">
                <input type="date" className="form-control" value={inicioFecha} min={minFecha} onChange={(e) => actualizarFechaHora(e.target.value, inicioHora, 'inicio')} style={inputStyle} required />
                <input type="time" className="form-control" value={inicioHora} onChange={(e) => actualizarFechaHora(inicioFecha, e.target.value, 'inicio')} style={inputTimeStyle} required />
              </div>
            </div>

            <div className="col-md-4 col-lg-4">
              <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>Fecha y hora de devolución</label>
              <div className="input-group flex-nowrap">
                <input type="date" className="form-control" value={finFecha} min={inicioFecha || minFecha} onChange={(e) => actualizarFechaHora(e.target.value, finHora, 'fin')} style={inputStyle} required />
                <input type="time" className="form-control" value={finHora} onChange={(e) => actualizarFechaHora(finFecha, e.target.value, 'fin')} style={inputTimeStyle} required />
              </div>
            </div>

            <div className="col-md-4 col-lg-3 d-flex gap-2">
              <button type="submit" className="btn btn-warning flex-grow-1 fw-bold" disabled={buscando} style={{ color: '#000', borderRadius: '8px' }}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
              {busqueda && (
                <button type="button" className="btn btn-outline-secondary" onClick={handleLimpiar} style={{ borderRadius: '8px' }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
          {errorBusqueda && <div className="alert alert-danger py-2 mt-3 mb-0">{errorBusqueda}</div>}
        </form>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" role="status"></div>
            <p className="mt-3 text-muted">Cargando vehículos...</p>
          </div>
        )}

        {error && <div className="alert alert-danger rounded-3 shadow-sm">{error}</div>}

        {busqueda && (
          <p className="text-muted mb-4">
            {lista.length === 0
              ? 'No hay vehículos disponibles en ese horario. Prueba con otras fechas.'
              : `${lista.length} vehículo(s) disponible(s) en el horario elegido.`}
          </p>
        )}

        <div className="row g-4">
          {listaPaginada.map((auto) => (
            <div className="col-md-6 col-lg-4" key={auto.id}>
              <div className="card h-100">
                <div className="position-relative">
                  <img
                    src={obtenerUrlImagen(auto.imagen_url)}
                    className="card-img-top"
                    alt={auto.modelo}
                    style={{ height: '220px', objectFit: 'cover', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                  />
                  <span
                    className={`position-absolute badge rounded-pill ${
                      busqueda || auto.estado === 'DISPONIBLE' ? 'bg-success' :
                      auto.estado === 'ALQUILADA' ? 'bg-primary' : 'bg-warning text-dark'
                    }`}
                    style={{ top: '16px', right: '16px', padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    {busqueda ? 'DISPONIBLE' : auto.estado}
                  </span>
                </div>

                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>{auto.marca} {auto.modelo}</h5>
                    <span className="text-muted fw-semibold">{auto.anio}</span>
                  </div>

                  <div className="d-flex flex-column gap-1 mb-4 mt-2">
                    {obtenerPrecio(auto, 'HORA') && (
                      <span className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--rc-text)' }}>
                        {formatearBs(obtenerPrecio(auto, 'HORA'))} / hora
                      </span>
                    )}
                    {obtenerPrecio(auto, 'DIA') && (
                      <span className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--rc-text)' }}>
                        {formatearBs(obtenerPrecio(auto, 'DIA'))} / día
                      </span>
                    )}
                  </div>

                  {auto.estado === 'MANTENIMIENTO' ? (
                    <button className="btn btn-outline-secondary w-100 py-2 mt-auto" disabled>
                      En mantenimiento
                    </button>
                  ) : (
                    <div className="d-flex gap-2 mt-auto"> 
                      <Link to={`/vehiculos/${auto.id}`} className="btn btn-dark w-100 py-2 mt-auto">
                        Detalles
                      </Link>
                      <Link to={enlaceReservar(auto.id)} className="btn btn-dark w-100 py-2 mt-auto">
                        Reservar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && totalPaginas > 1 && (
          <div className="d-flex justify-content-center mt-5">
            <nav aria-label="Paginación de vehículos">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${paginaSegura === 1 ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => cambiarPagina(paginaSegura - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <li
                    key={num}
                    className={`page-item ${num === paginaSegura ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => cambiarPagina(num)}
                    >
                      {num}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${paginaSegura === totalPaginas ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => cambiarPagina(paginaSegura + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}