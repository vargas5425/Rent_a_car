import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function CrearVehiculoPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    placa: '', marca: '', modelo: '', anio: 2024, 
    categoria_id: 1, transmision: 'MANUAL', pasajeros: 5, kilometraje_actual: 0
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/vehiculos', formData);
      alert('¡Vehículo creado exitosamente!');
      navigate('/vehiculos');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear vehículo';
      setError(msg);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px', maxWidth: '600px' }}>
        <div className="card shadow border-0 p-4">
          <h2 className="fw-bold mb-4">Registrar Nuevo Vehículo</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Placa / Código</label>
                <input type="text" name="placa" className="form-control" onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Año</label>
                <input type="number" name="anio" className="form-control" onChange={handleChange} value={formData.anio} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Marca</label>
                <input type="text" name="marca" className="form-control" onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Modelo</label>
                <input type="text" name="modelo" className="form-control" onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Categoría ID (1: SUV, 2: Sedán, 3: Hatchback)</label>
                <input type="number" name="categoria_id" className="form-control" onChange={handleChange} value={formData.categoria_id} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Pasajeros</label>
                <input type="number" name="pasajeros" className="form-control" onChange={handleChange} value={formData.pasajeros} required />
              </div>
            </div>

            <button type="submit" className="btn btn-dark w-100 mt-3">Guardar Vehículo</button>
          </form>
        </div>
      </div>
    </div>
  );
}