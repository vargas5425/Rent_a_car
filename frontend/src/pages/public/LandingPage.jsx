import Navbar from '../../components/layout/Navbar/Navbar';
import Hero from '../../components/home/Hero/Hero';
import Brands from '../../components/home/Brands/Brands';
import InfoSection from '../../components/home/InfoSection/InfoSection';
import CitiesSection from '../../components/home/CitiesSection/CitiesSection';
import Footer from '../../components/layout/Footer/Footer';

export default function LandingPage() {
  return (
    <div className="bg-light">
      <Navbar />
      <Hero />
      <Brands />
      <InfoSection />
      <CitiesSection />
      <Footer />
    </div>
  );
}