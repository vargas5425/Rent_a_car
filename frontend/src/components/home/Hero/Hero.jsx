import './Hero.css';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Premium<br />
            Rental Cars<br />
            in Bolivia
          </h1>
          <p className="hero-subtitle">
            No te prives del placer de conducir los mejores automóviles premium 
            de todo el mundo, aquí y ahora.
          </p>
        </div>

        <div className="hero-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop"
            alt="Premium car"
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
}