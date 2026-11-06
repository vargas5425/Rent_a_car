import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      
      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        {/* Cabecera */}
        <div className="mb-5 text-center">
          <h1 className="fw-bold mb-2" style={{ color: 'var(--brand-primary, #0f172a)' }}>Nuestra Flota</h1>
          <p className="text-muted">Elige el vehículo perfecto para tu próximo viaje.</p>
        </div>
        
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 text-muted">Cargando vehículos...</p>
          </div>
        )}
        
        {error && <div className="alert alert-danger rounded-3 shadow-sm">{error}</div>}

        <div className="row g-4">
          {vehiculos.map((auto) => (
            <div className="col-md-6 col-lg-4" key={auto.id}>
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
                      auto.estado === 'DISPONIBLE' ? 'bg-success' : 
                      auto.estado === 'ALQUILADA' ? 'bg-primary' : 
                      'bg-warning text-dark'
                    }`}
                    style={{ top: '16px', right: '16px', padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    {auto.estado}
                  </span>
                </div>
                
                {/* Información del vehículo */}
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-0">{auto.marca} {auto.modelo}</h5>
                    <span className="text-muted fw-semibold">{auto.anio}</span>
                  </div>
                  
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    {auto.categoria ? auto.categoria.nombre : 'N/A'} • {auto.transmision} • {auto.pasajeros} pasajeros
                  </p>
                  
                  <div className="d-flex align-items-center text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                    <span>📍 {auto.kilometraje_actual.toLocaleString()} km</span>
                  </div>
                  
                  <Link to={`/vehiculos/${auto.id}`} className="btn btn-dark w-100 py-2">
                    Ver Detalles
                  </Link>
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