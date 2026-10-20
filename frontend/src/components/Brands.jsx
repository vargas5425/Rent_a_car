import './Brands.css';

const brands = [
  { name: 'Ferrari', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/ferrari-logo.svg' },
  { name: 'Jaguar', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/jaguar-logo.svg' },
  { name: 'Lamborghini', logo: 'https://cdn.worldvectorlogo.com/logos/lamborghini.svg' },
  { name: 'Porsche', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/porsche-logo.svg' },
  { name: 'Tesla', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/tesla-logo.svg' },
  { name: 'Audi', logo: 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/audi-logo.svg' },
];

export default function Brands() {
  return (
    <section className="brands-section">
      <div className="brands-container">
        {brands.map((brand) => (
          <div key={brand.name} className="brand-item">
            <img src={brand.logo} alt={brand.name} className="brand-logo" />
          </div>
        ))}
      </div>
    </section>
  );
}
