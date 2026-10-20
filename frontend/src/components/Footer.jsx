import './Footer.css';
import logo from '../assets/images/logo.png'; 

export default function Footer() {
  return (
    <footer className="footer-custom">
      <div className="footer-container">
        <div className="footer-brand">
          <img src={logo} alt="TerreCars" className="brand-logo" />
          <span className="brand-name">Tierra Camba</span>
        </div>

        <div className="footer-links">
          <a href="/terminos">Términos</a>
          <a href="/privacidad">Privacidad</a>
          <a href="/ayuda">Ayuda</a>
        </div>

        <div className="footer-contact">
          <span>info@rentacar.com</span>
          <span>+591 12345678</span>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 TerreCars. Todos los derechos reservados.
      </div>
    </footer>
  );
}