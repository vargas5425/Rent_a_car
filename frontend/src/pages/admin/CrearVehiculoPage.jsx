import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function CrearVehiculoPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [formData, setFormData] = useState({
    placa: '', marca: '', modelo: '', anio: 2024, 
    categoria_id: 1, transmision: 'MANUAL', pasajeros: 5, kilometraje_actual: 0,
    precio_hora: 40, precio_dia: 300,
    estado: 'DISPONIBLE', imagen_url: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(esEdicion);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [categorias, setCategorias] = useState([]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await api.get('/categorias');
        setCategorias(res.data);
      } catch (err) {
        console.error('Error al cargar categorías', err);
      }
    };
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (!esEdicion) return;
    let isMounted = true;
    const cargarVehiculo = async () => {
      try {
        const res = await api.get('/vehiculos');
        const auto = res.data.find(v => String(v.id) === String(id));
        if (auto && isMounted) setFormData(auto);
        else if (isMounted) setError('Vehículo no encontrado');
      } catch (err) {
        if (isMounted) setError('Error al cargar el vehículo');
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargarVehiculo();
    return () => { isMounted = false; };
  }, [id, esEdicion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubiendoImagen(true);
    const uploadData = new FormData();
    uploadData.append('imagen', file);

    try {
      const res = await api.post('/vehiculos/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, imagen_url: res.data.imagen_url });
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (esEdicion) {
        await api.put(`/vehiculos/${id}`, formData);
        alert('¡Vehículo actualizado exitosamente!');
      } else {
        await api.post('/vehiculos', formData);
        alert('¡Vehículo creado exitosamente!');
      }
      navigate('/dashboard/admin/vehiculos');
    } catch (err) {
      const msg = err.response?.data?.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} vehículo`;
      setError(msg);
    }
  };

  const handleCancelar = () => {
    navigate('/dashboard/admin/vehiculos');
  };

  if (cargando) return <div className="container py-5 text-center">Cargando...</div>;

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px', maxWidth: '600px' }}>
        <div className="card shadow border-0 p-4">
          <h2 className="fw-bold mb-4" style={{ color: 'var(--rc-text)' }}>
            {esEdicion ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          </h2>
          
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Placa / Código</label>
                <input type="text" name="placa" className="form-control" value={formData.placa} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Año</label>
                <input type="number" name="anio" className="form-control" value={formData.anio} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Marca</label>
                <input type="text" name="marca" className="form-control" value={formData.marca} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Modelo</label>
                <input type="text" name="modelo" className="form-control" value={formData.modelo} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              {/* SELECTOR DE CATEGORÍA */}
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Categoría</label>
                <select 
                  name="categoria_id" 
                  className="form-select" 
                  value={formData.categoria_id} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Pasajeros</label>
                <input type="number" name="pasajeros" className="form-control" value={formData.pasajeros} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Precio por hora (Bs)</label>
                <input type="number" min="1" step="0.01" name="precio_hora" className="form-control" value={formData.precio_hora} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Precio por día (Bs)</label>
                <input type="number" min="1" step="0.01" name="precio_dia" className="form-control" value={formData.precio_dia} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Estado</label>
                <select name="estado" className="form-select" value={formData.estado} onChange={handleChange}>
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  <option value="ALQUILADA">ALQUILADA</option>
                  <option value="RESERVADA">RESERVADA</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Kilometraje</label>
                <input type="number" name="kilometraje_actual" className="form-control" value={formData.kilometraje_actual} onChange={handleChange} required />
              </div>
            </div>

            {/* SUBIDA DE IMAGEN */}
            <div className="mb-4">
              <label className="form-label" style={{ color: 'var(--rc-text)' }}>Imagen del Vehículo</label>
              <input 
                type="file" 
                accept="image/*"
                className="form-control" 
                onChange={handleImageUpload} 
                disabled={subiendoImagen}
              />
              {subiendoImagen && <small className="text-primary d-block mt-1">Subiendo imagen...</small>}
              
              {formData.imagen_url && (
                <img 
                  src={obtenerUrlImagen(formData.imagen_url)}
                  alt="Vista previa" 
                  className="mt-3 rounded" 
                  style={{ height: '100px', objectFit: 'cover' }} 
                />
              )}
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-grow-1" disabled={subiendoImagen}>
                {esEdicion ? 'Guardar Cambios' : 'Registrar Vehículo'}
              </button>
              <button type="button" onClick={handleCancelar} className="btn btn-outline-secondary flex-grow-1">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}