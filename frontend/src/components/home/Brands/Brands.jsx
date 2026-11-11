import './Brands.css';

const brands = [
  { name: 'Ferrari', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/ferrari-logo.svg' },
  { name: 'Jaguar', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/jaguar-logo.svg' },
  { name: 'Lamborghini', logo: 'https://cdn.worldvectorlogo.com/logos/lamborghini.svg' },
  { name: 'Porsche', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/porsche-logo.svg' },
  { name: 'Tesla', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/tesla-logo.svg' },
  { name: 'Audi', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/audi-logo.svg' },
  
  // 👇 Nuevas marcas
  { name: 'BMW', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/bmw-logo.svg' },
  { name: 'Mercedes', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/mercedes-benz-logo.svg' },
  { name: 'Toyota', logo: 'https://cdn.worldvectorlogo.com/logos/toyota-1.svg' },
  { name: 'Ford', logo: 'https://cdn.worldvectorlogo.com/logos/ford-1.svg' },
  { name: 'Chevrolet', logo: 'https://cdn.worldvectorlogo.com/logos/chevrolet-1.svg' },
  ];
  

export default function Brands() {
  // Duplicamos el array para que el efecto de desplazamiento sea infinito y no haya cortes
  const brandsDuplicadas = [...brands, ...brands];

  return (
    <section className="brands-section">
      <div className="brands-marquee">
        <div className="brands-track">
          {brandsDuplicadas.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="brand-item">
              <img src={brand.logo} alt={brand.name} className="brand-logo" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}