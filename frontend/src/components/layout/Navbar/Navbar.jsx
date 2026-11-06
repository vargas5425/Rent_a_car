import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import logo from '../../../assets/images/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirigir a la Landing Page al cerrar sesión
  };

  return (
    <nav className="navbar-custom">
      <div className="navbar-container">
        
        {/* LOGO Y MARCA */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Tierra Camba" style={{ height: '40px' }} />
          <span className="brand-name" style={{ color: '#0f172a', fontSize: '1.2rem' }}>
            Tierra Camba
          </span>
        </Link>

        {/* ENLACES Y BOTONES */}
        <div className="navbar-links">
          {usuario ? (
            <>
              {usuario.rol === 'CLIENTE' && (
                <Link to="/vehiculos" className="nav-link-custom" style={{ color: '#3b82f6', fontWeight: '600' }}>
                  List Cars
                </Link>
              )}
              {(usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'EMPLEADO') && (
                <>
                  <Link to="/vehiculos" className="nav-link-custom" style={{ color: '#3b82f6', fontWeight: '600' }}>
                    List Cars
                  </Link>
                  <Link to="/dashboard" className="nav-link-custom" style={{ color: '#3b82f6', fontWeight: '600' }}>
                    Dashboard
                  </Link>
                </>
              )}
              
              <div className="user-menu ms-3">
                <span className="user-name">Hola, {usuario.nombre}</span>
                <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Iniciar Sesión</Link>
              <Link to="/register" className="btn-register">Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}