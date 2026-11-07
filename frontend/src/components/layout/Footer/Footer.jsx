import './Footer.css';
import logo from '../../../assets/images/logo.png'; 

export default function Footer() {
  return (
    <footer className="footer-custom">
      <div className="container py-5">
        <div className="row g-4">
          
          {/* Columna 1: Marca y Redes */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img src={logo} alt="Tierra Camba" style={{ height: '40px' }} />
              <span className="fs-4 fw-bold text-white">Tierra Camba</span>
            </div>
            <p className="text-white-50 mb-4" style={{ fontSize: '0.9rem' }}>
              Descarga la aplicación de Tierra Camba y gestiona tus reservas desde cualquier lugar.
            </p>
            
            {/* Botones de App Store / Play Store con Font Awesome */}
            <div className="d-flex gap-2 mb-4">
              <button className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 rounded-pill px-3">
                <i className="fa fa-apple" aria-hidden="true"></i> App Store
              </button>
              <button className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 rounded-pill px-3">
                <i className="fa fa-android" aria-hidden="true"></i> Google Play
              </button>
            </div>

            <h6 className="text-white fw-bold mb-3">Síguenos en Redes</h6>
            <div className="d-flex gap-3 social-icons">
              <a href="#" className="text-white-50 fs-5"><i className="fa fa-facebook" aria-hidden="true"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="fa fa-twitter" aria-hidden="true"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="fa fa-instagram" aria-hidden="true"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="fa fa-youtube-play" aria-hidden="true"></i></a>
            </div>
          </div>

          {/* Columna 2: Información de la compañía */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="text-white fw-bold mb-4">Información de la compañía</h6>
            <ul className="list-unstyled footer-links-list">
              <li><a href="#">Acerca de Tierra Camba</a></li>
              <li><a href="#">Relación con Inversores</a></li>
              <li><a href="#">Sala de Prensa</a></li>
              <li><a href="#">Trabaja con nosotros</a></li>
              <li><a href="#">El Mejor Precio Garantizado</a></li>
              <li><a href="#">Blog de Viajes</a></li>
            </ul>
          </div>

          {/* Columna 3: Negocios B2B */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="text-white fw-bold mb-4">Negocios B2B</h6>
            <ul className="list-unstyled footer-links-list">
              <li><a href="#">Apertura de Franquicias</a></li>
              <li><a href="#">Compañías Aliadas</a></li>
              <li><a href="#">Actualización Financiera</a></li>
              <li><a href="#">Acceso a Agencias de Viajes</a></li>
              <li><a href="#">Contacto para Agencias</a></li>
              <li><a href="#">Herramientas GDS</a></li>
            </ul>
          </div>

          {/* Columna 4: Ayuda al Cliente */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="text-white fw-bold mb-4">Ayuda al Cliente</h6>
            <ul className="list-unstyled footer-links-list">
              <li><a href="#">Productos y Servicios</a></li>
              <li><a href="#">Términos y Condiciones</a></li>
              <li><a href="#">Contacto</a></li>
              <li><a href="#">Facturas</a></li>
              <li><a href="#">Parte de Accidentes</a></li>
              <li><a href="#">Seguridad de la Información</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Parte inferior del Footer */}
      <div className="footer-bottom">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="mb-0 text-white-50" style={{ fontSize: '0.85rem' }}>
            © 2026 Tierra Camba. Todos los derechos reservados.
          </p>
          <p className="mb-0 text-white-50" style={{ fontSize: '0.85rem' }}>
            Hecho en Bolivia 🇧🇴
          </p>
        </div>
      </div>
    </footer>
  );
}