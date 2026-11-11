import './CitiesSection.css';
import santa_cruz from '../../../assets/images/santa_cruz.jfif';
import la_paz from '../../../assets/images/la_paz.jfif';
import cochabamba from '../../../assets/images/cochabamba.jfif';
import sucre from '../../../assets/images/sucre.jfif';
import tarija from '../../../assets/images/tarija.jfif';
import oruro from '../../../assets/images/oruro.jfif';

const ciudades = [
  { nombre: 'Santa Cruz', img: santa_cruz },
  { nombre: 'La Paz', img: la_paz },
  { nombre: 'Cochabamba', img: cochabamba },
  { nombre: 'Sucre', img: sucre },
  { nombre: 'Tarija', img: tarija },
  { nombre: 'Oruro', img: oruro }
];

export default function CitiesSection() {
  return (
    <div className="container py-5 mb-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold">Ciudades principales en Bolivia</h2>
        <div
          className="mx-auto mt-3 rounded-pill"
          style={{ width: '60px', height: '4px', backgroundColor: '#fbbf24' }}
        ></div>
      </div>

      <div className="row g-4">
        {ciudades.map((ciudad, index) => (
          <div className="col-md-4" key={index}>
            <div
              className="city-card position-relative rounded-4 overflow-hidden shadow-sm"
              style={{ height: '250px', backgroundColor: '#e5e7eb' }}
            >
              {/* Imagen: misma proporción 3:2 que la card → cover no recorta */}
              <img
                src={ciudad.img}
                alt={ciudad.nombre}
                className="w-100 h-100"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />

              {/* Gradiente solo en la parte inferior para no oscurecer toda la imagen */}
              <div
                className="position-absolute bottom-0 start-0 w-100"
                style={{
                  height: '55%',
                  background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.75))'
                }}
              ></div>

                <div className="position-absolute bottom-0 start-0 p-4 w-100 d-flex justify-content-between align-items-end">
                  <h4 className="text-white fw-bold mb-0">{ciudad.nombre}</h4>
                  <button
                    className="btn btn-warning rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <i className="fa fa-arrow-circle-right" aria-hidden="true"></i>
                  </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}