import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatearBs } from '../../utils/reservas';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

export default function VehiculoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const cargarVehiculo = async () => {
      try {
        const res = await api.get('/vehiculos');
        if (isMounted) {
          const auto = res.data.find(v => String(v.id) === String(id));
          if (auto) setVehiculo(auto);
          else setError('Vehículo no encontrado');
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar el vehículo');
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargarVehiculo();
    return () => { isMounted = false; };
  }, [id]);

  if (cargando) return <div className="container py-5 text-center">Cargando...</div>;
  if (error) return <div className="container py-5 text-center text-danger">{error}</div>;

  // Obtenemos el precio de las tarifas
  const getPrecio = (modalidad) => {
    if (!vehiculo || !vehiculo.tarifas) return null;
    const tarifa = vehiculo.tarifas.find(t => t.modalidad === modalidad);
    return tarifa ? tarifa.precio : null;
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        <Link to="/vehiculos" className="text-decoration-none text-muted mb-3 d-inline-block">← Volver a la flota</Link>
        
        <div className="row g-5">
          {/* Imagen Grande */}
          <div className="col-md-7">
            <img 
              src={obtenerUrlImagen(vehiculo.imagen_url)} 
              alt={vehiculo.modelo} 
              className="img-fluid rounded-4 shadow-sm w-100"
              style={{ maxHeight: '500px', objectFit: 'cover' }}
            />
          </div>

          {/* Información */}
          <div className="col-md-5">
            <span className="badge bg-success mb-2">{vehiculo.estado}</span>
            <h1 className="fw-bold mb-2" style={{ color: 'var(--rc-text)' }}>{vehiculo.marca} {vehiculo.modelo}</h1>
            <p className="text-muted fs-5 mb-4">Año {vehiculo.anio} • Placa: {vehiculo.placa}</p>
            
            <div className="card p-4 mb-4" style={{ backgroundColor: 'var(--rc-card)' }}>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--rc-text)' }}>Especificaciones</h5>
              <ul className="list-unstyled mb-0">
                <li className="mb-2" style={{ color: 'var(--rc-text)' }}><i className="fa fa-check text-success me-2"></i> Categoría: <strong>{vehiculo.categoria ? vehiculo.categoria.nombre : 'N/A'}</strong></li>
                <li className="mb-2" style={{ color: 'var(--rc-text)' }}><i className="fa fa-check text-success me-2"></i> Transmisión: <strong>{vehiculo.transmision}</strong></li>
                <li className="mb-2" style={{ color: 'var(--rc-text)' }}><i className="fa fa-check text-success me-2"></i> Pasajeros: <strong>{vehiculo.pasajeros}</strong></li>
                <li className="mb-2" style={{ color: 'var(--rc-text)' }}><i className="fa fa-check text-success me-2"></i> Kilometraje: <strong>{vehiculo.kilometraje_actual} km</strong></li>
              </ul>
            </div>

            <div className="card p-4 mb-4" style={{ backgroundColor: 'var(--rc-card)' }}>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--rc-text)' }}>Tarifas</h5>
              <div className="d-flex justify-content mb-2">
                <span className="text-muted">Por hora:</span>
                <strong className="text-warning">{getPrecio('HORA') ? formatearBs(getPrecio('HORA')) : 'No disponible'}</strong>
              </div>
              <div className="d-flex justify-content mb-2">
                <span className="text-muted">Por día:</span>
                <strong className="text-warning">{getPrecio('DIA') ? formatearBs(getPrecio('DIA')) : 'No disponible'}</strong>
              </div>
            </div>

            <button 
              className="btn btn-dark w-100 py-3 fw-bold"
              onClick={() => navigate(`/vehiculos/${vehiculo.id}/reservar`)}
              disabled={vehiculo.estado === 'MANTENIMIENTO'}
            >
              {vehiculo.estado === 'MANTENIMIENTO' ? 'En mantenimiento' : 'Reservar ahora'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}