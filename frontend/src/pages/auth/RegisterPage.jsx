import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/register', formData);
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        
        {/* Lado Izquierdo: Imagen (Oculto en móviles) */}
        <div className="col-md-6 d-none d-md-block" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="h-100 d-flex align-items-end p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            <div>
              <h1 className="text-white fw-bold display-4 mb-2">Únete a Tierra Camba.</h1>
              <p className="text-white-50 fs-5">La mejor flota de vehículos premium te espera.</p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-white position-relative">
          
          {/* BOTÓN VOLVER AL INICIO */}
          <Link to="/" className="btn-volver-inicio position-absolute top-0 start-0 m-4 d-flex align-items-center gap-2 text-decoration-none fw-bold">
            Volver al inicio
          </Link>

          <div className="w-100 px-5 py-4" style={{ maxWidth: '450px' }}>
            
            <h2 className="fw-bold mb-1">Crear una cuenta</h2>
            <p className="text-muted mb-4">Ingresa tus datos para comenzar a reservar.</p>
            
            {error && <div className="alert alert-danger py-2 rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre Completo</label>
                <input 
                  type="text" 
                  name="nombre"
                  className="form-control form-control-lg bg-light" 
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Correo Electrónico</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-control form-control-lg bg-light" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-semibold">Contraseña</label>
                <input 
                  type="password" 
                  name="password"
                  className="form-control form-control-lg bg-light" 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-dark w-100 py-3 fw-bold rounded-3"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </button>
            </form>

            <div className="text-center mt-4">
              <small className="text-muted">
                ¿Ya tienes una cuenta? <Link to="/login" className="fw-semibold text-decoration-none">Inicia sesión</Link>
              </small>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}