import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import logo from '../assets/images/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();

  return (
    <nav className="navbar-custom">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
        <img src={logo} alt="TerreCars" className="brand-logo" /> 
          <span className="brand-name">Tierra Camba</span>
        </Link>

        <div className="navbar-links">
          <Link to="/vehiculos" className="nav-link-custom">List Cars</Link>
          <Link to="/dashboard" className="nav-link-custom">Dashboard</Link>

          {/* Si el usuario está logueado, mostramos su nombre y botón de salir */}
          {usuario ? (
            <div className="user-menu">
              <span className="user-name">Hola, {usuario.nombre}</span>
              <button onClick={logout} className="btn-logout">Cerrar Sesión</button>
            </div>
          ) : (
            /* Si NO está logueado, mostramos los botones de Login y Registro */
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