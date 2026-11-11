import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const usuarioLogueado = await login(email, password);
      if (usuarioLogueado.rol === 'ADMINISTRADOR' || usuarioLogueado.rol === 'EMPLEADO') {
        navigate('/dashboard');
      } else {
        navigate('/vehiculos');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        
        {/* Lado Izquierdo: Imagen */}
        <div className="col-md-6 d-none d-md-block" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="h-100 d-flex align-items-end p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            <h1 className="text-white fw-bold display-4">Bienvenido a Tierra Camba.</h1>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-white position-relative">
          
          {/* BOTÓN VOLVER AL INICIO */}
          <Link to="/" className="btn-volver-inicio position-absolute top-0 start-0 m-4 d-flex align-items-center gap-2 text-decoration-none fw-bold">
            Volver al inicio
          </Link>

          <div className="w-100 px-5" style={{ maxWidth: '450px' }}>
            <h2 className="fw-bold mb-1">Iniciar Sesión</h2>
            <p className="text-muted mb-4">Ingresa tus credenciales para continuar.</p>
            
            {error && <div className="alert alert-danger py-2 rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg bg-light" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Contraseña</label>
                <input 
                  type="password" 
                  className="form-control form-control-lg bg-light" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>
              <button type="submit" className="btn btn-dark w-100 py-3 fw-bold rounded-3">
                Entrar al sistema
              </button>
            </form>

            <div className="text-center mt-4">
              <small className="text-muted">¿No tienes cuenta? <Link to="/register" className="fw-semibold text-decoration-none">Regístrate aquí</Link></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}