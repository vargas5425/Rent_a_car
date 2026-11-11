import { useState, useEffect } from 'react';
import { tarifaService } from '../../services/tarifaService';

export default function AdminTarifasPage() {
  const [tarifas, setTarifas] = useState([]);
  const [formData, setFormData] = useState({
    modalidad: 'DIA',
    precio: '',
    categoria_id: 1 // Por defecto ponemos la categoría 1 (SUV)
  });
  const [mensaje, setMensaje] = useState('');

  // Cargar las tarifas cuando abre la página
  const cargarTarifas = async () => {
    try {
      const data = await tarifaService.listar();
      setTarifas(data);
    } catch (error) {
      console.error("Error al cargar tarifas", error);
    }
  };

  useEffect(() => {
    cargarTarifas();
  }, []);

  // Guardar una nueva tarifa
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tarifaService.crear({
        ...formData,
        precio: parseFloat(formData.precio),
        categoria_id: parseInt(formData.categoria_id)
      });
      setMensaje('¡Tarifa creada con éxito!');
      setFormData({ modalidad: 'DIA', precio: '', categoria_id: 1 });
      cargarTarifas(); // Recargar la tabla
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarTarifa = async (id) => {
  if (window.confirm('¿Seguro que deseas eliminar esta tarifa?')) {
    try {
      // Nota: Necesitas agregar esta función en tu tarifaService.js
      await tarifaService.eliminar(id); 
      cargarTarifas();
    } catch (error) {
      alert('Error al eliminar');
    }
  }
};

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4">Gestión de Tarifas</h2>
      
      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      {/* Formulario */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-dark text-white fw-bold">
          Agregar Nueva Tarifa
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Modalidad</label>
              <select 
                className="form-select"
                value={formData.modalidad}
                onChange={(e) => setFormData({...formData, modalidad: e.target.value})}
              >
                <option value="HORA">Por Hora</option>
                <option value="DIA">Por Día</option>
                <option value="SEMANA">Por Semana</option>
                <option value="MES">Por Mes</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Precio (Bs)</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.precio}
                onChange={(e) => setFormData({...formData, precio: e.target.value})}
                required 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">ID Categoría</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.categoria_id}
                onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                required 
              />
            </div>
            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-dark w-100">Guardar Tarifa</button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Tarifas */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white fw-bold">
          Tarifas Registradas
        </div>
        <div className="card-body p-0">
<table className="table table-hover mb-0">
  <thead className="table-light">
    <tr>
      <th>ID</th>
      <th>Modalidad</th>
      <th>Precio (Bs)</th>
      <th>Categoría ID</th>
      <th>Acciones</th> 
    </tr>
  </thead>
  <tbody>
    {tarifas.length === 0 ? (
      <tr><td colSpan="5" className="text-center py-3">No hay tarifas registradas</td></tr> 
    ) : (
      tarifas.map((tarifa) => (
        <tr key={tarifa.id}>
          <td>{tarifa.id}</td>
          <td><span className="badge bg-info text-dark">{tarifa.modalidad}</span></td>
          <td>{tarifa.precio}</td>
          <td>{tarifa.categoria_id}</td>
          <td>
            <button className="btn btn-sm btn-danger" onClick={() => eliminarTarifa(tarifa.id)}>
              Eliminar
            </button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
        </div>
      </div>
    </div>
  );
}