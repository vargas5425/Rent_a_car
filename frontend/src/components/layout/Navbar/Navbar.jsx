import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import ThemeToggle from './ThemeToggle';
import logo from '../../../assets/images/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Efecto para que el navbar cambie al hacer scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar-custom ${scrolled ? 'rc-navbar--scrolled' : ''}`}>
      <div className="navbar-container">
        
        {/* LOGO Y MARCA */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Tierra Camba" className="brand-logo" />
          <span className="brand-name">
            Tierra Camba
          </span>
        </Link>

        {/* ENLACES Y BOTONES */}
        <div className="navbar-links">
          {usuario ? (
            <>
              {usuario.rol === 'CLIENTE' && (
                <Link to="/vehiculos" className="nav-link-custom">
                  List Cars
                </Link>
              )}
              {(usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'EMPLEADO') && (
                <>
                  <Link to="/vehiculos" className="nav-link-custom">List Cars</Link>
                  <Link to="/dashboard" className="nav-link-custom">Dashboard</Link>
                </>
              )}
              
              <div className="user-menu ms-3">
                <span className="user-name">Hola, {usuario.nombre}</span>
                <button onClick={handleLogout} className="btn-logout">Salir</button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Iniciar Sesión</Link>
              <Link to="/register" className="btn-register">Registrarse</Link>
            </div>
          )}

          {/* El botón mágico de Work/Sleep */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}