import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { buscarDisponibles } from '../../services/reservasService';
import { validarBusqueda, aInputFecha, formatearBs } from '../../utils/reservas';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

// Función auxiliar para obtener la fecha en formato YYYY-MM-DD respetando la zona horaria local
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Función para generar fecha y hora por defecto (Hoy o Mañana a las 12:00)
const generarFechaHoraDefault = (diasExtra = 0) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasExtra);
  fecha.setHours(12, 0, 0, 0); // Establecer a las 12:00 PM
  
  const fechaStr = getLocalDateString(fecha);
  return `${fechaStr}T12:00`;
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inicializamos los estados con valores por defecto (Hoy y Mañana a las 12:00)
  const [inicio, setInicio] = useState(() => generarFechaHoraDefault(0));
  const [fin, setFin] = useState(() => generarFechaHoraDefault(1));
  
  const [busqueda, setBusqueda] = useState(null);
  const [disponibles, setDisponibles] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  useEffect(() => {
    let isMounted = true;
    const cargarVehiculos = async () => {
      try {
        const response = await api.get('/vehiculos');
        if (isMounted) setVehiculos(response.data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || 'Error al cargar los vehículos.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    cargarVehiculos();
    return () => { isMounted = false; };
  }, []);

  // Función para actualizar la fecha y hora combinadas en el estado
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
      setDisponibles(resultado);
      setBusqueda({ inicio, fin });
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
  };

  const lista = disponibles ?? vehiculos;
  const minFecha = getLocalDateString(new Date());
  
  const enlaceReservar = (id) =>
    busqueda
      ? `/vehiculos/${id}/reservar?inicio=${encodeURIComponent(busqueda.inicio)}&fin=${encodeURIComponent(busqueda.fin)}`
      : `/vehiculos/${id}/reservar`;

  // Extraemos las partes de la fecha y hora para los inputs
  const inicioFecha = inicio ? inicio.split('T')[0] : '';
  const inicioHora = inicio ? inicio.split('T')[1] : '';
  const finFecha = fin ? fin.split('T')[0] : '';
  const finHora = fin ? fin.split('T')[1] : '';

  // Estilos para unir visualmente los inputs de fecha y hora
  const inputStyle = {
    borderRight: 'none',
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
    minWidth: '130px'
  };
  
  const inputTimeStyle = {
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
    width: '115px', // Ancho aumentado para evitar que se corte el texto
    flex: 'none',
    paddingLeft: '10px',
    paddingRight: '5px'
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      
      {/* ESTILOS PARA FORZAR QUE LA HORA SE VEA COMPLETA Y QUITAR EL ICONO */}
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none; /* Oculta el icono del reloj que quita espacio */
        }
        input[type="time"] {
          text-align: center; /* Centra el texto de la hora */
        }
      `}</style>

      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        <div className="mb-4 text-center">
          <h1 className="fw-bold mb-2" style={{ color: 'var(--rc-text)' }}>Nuestra Flota</h1>
          <p className="text-muted">Elige el vehículo perfecto para tu próximo viaje.</p>
        </div>

        {/* Buscador por fechas */}
        <form onSubmit={handleBuscar} noValidate className="card p-4 mb-5">
          <div className="row g-3 justify-content-center align-items-end">
            
            {/* RECOGIDA */}
            <div className="col-md-4 col-lg-4">
              <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                Fecha y hora de recogida
              </label>
              <div className="input-group flex-nowrap">
                <input
                  type="date"
                  className="form-control"
                  value={inicioFecha}
                  min={minFecha}
                  onChange={(e) => actualizarFechaHora(e.target.value, inicioHora, 'inicio')}
                  style={inputStyle}
                  required
                />
                <input
                  type="time"
                  className="form-control"
                  value={inicioHora}
                  onChange={(e) => actualizarFechaHora(inicioFecha, e.target.value, 'inicio')}
                  style={inputTimeStyle}
                  required
                />
              </div>
            </div>

            {/* DEVOLUCIÓN */}
            <div className="col-md-4 col-lg-4">
              <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                Fecha y hora de devolución
              </label>
              <div className="input-group flex-nowrap">
                <input
                  type="date"
                  className="form-control"
                  value={finFecha}
                  min={inicioFecha || minFecha}
                  onChange={(e) => actualizarFechaHora(e.target.value, finHora, 'fin')}
                  style={inputStyle}
                  required
                />
                <input
                  type="time"
                  className="form-control"
                  value={finHora}
                  onChange={(e) => actualizarFechaHora(finFecha, e.target.value, 'fin')}
                  style={inputTimeStyle}
                  required
                />
              </div>
            </div>

            {/* BOTONES */}
            <div className="col-md-4 col-lg-3 d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-warning flex-grow-1 fw-bold" 
                disabled={buscando} 
                style={{ color: '#000', borderRadius: '8px' }}
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
              {busqueda && (
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handleLimpiar} 
                  style={{ borderRadius: '8px' }}
                >
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
          {lista.map((auto) => (
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

                  {auto.estado === 'MANTENIMIENTO' ? (
                    <button className="btn btn-outline-secondary w-100 py-2 mt-auto" disabled>
                      En mantenimiento
                    </button>
                  ) : (
                    <Link to={enlaceReservar(auto.id)} className="btn btn-dark w-100 py-2 mt-auto">
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