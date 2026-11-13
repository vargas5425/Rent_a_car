import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tarifaService } from '../../services/tarifaService';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function AdminTarifasPage() {
  const [tarifas, setTarifas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  
  const [formData, setFormData] = useState({
    modalidad: 'DIA',
    precio: '',
    tipo: 'categoria',
    categoria_id: '',
    vehiculo_id: ''
  });
  
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // 👇 Estados para la edición
  const [editandoId, setEditandoId] = useState(null);
  const [precioEditado, setPrecioEditado] = useState('');

  const cargarDatos = async () => {
    try {
      const [resTarifas, resCategorias, resVehiculos] = await Promise.all([
        tarifaService.listar(),
        api.get('/categorias'),
        api.get('/vehiculos')
      ]);
      setTarifas(resTarifas);
      setCategorias(resCategorias.data);
      setVehiculos(resVehiculos.data);
    } catch (error) {
      console.error("Error al cargar datos", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      const payload = {
        modalidad: formData.modalidad,
        precio: parseFloat(formData.precio),
        categoria_id: formData.tipo === 'categoria' ? parseInt(formData.categoria_id) : null,
        vehiculo_id: formData.tipo === 'vehiculo' ? parseInt(formData.vehiculo_id) : null
      };

      await tarifaService.crear(payload);
      setMensaje('¡Tarifa creada con éxito!');
      setFormData({ modalidad: 'DIA', precio: '', tipo: 'categoria', categoria_id: '', vehiculo_id: '' });
      cargarDatos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarTarifa = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarifa?')) {
      try {
        await tarifaService.eliminar(id);
        cargarDatos();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  // 👇 Función para guardar la edición
  const handleGuardarEdicion = async (id) => {
    try {
      await api.put(`/tarifas/${id}`, { precio: parseFloat(precioEditado) });
      setEditandoId(null);
      cargarDatos();
    } catch (error) {
      alert('Error al actualizar la tarifa');
    }
  };

  const getNombreCategoria = (id) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.nombre : `Categoría #${id}`;
  };

  const getNombreVehiculo = (id) => {
    const v = vehiculos.find(veh => veh.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placa})` : `Vehículo #${id}`;
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="container py-5" style={{ marginTop: '80px', maxWidth: '900px' }}>
        <div className="mb-4">
          <Link to="/dashboard" className="text-decoration-none text-muted">← Volver al Dashboard</Link>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>Gestión de Tarifas</h2>
        </div>
        
        {mensaje && <div className="alert alert-info">{mensaje}</div>}

        {/* Formulario */}
        <div className="card shadow-sm mb-5" style={{ backgroundColor: 'var(--rc-card)' }}>
          <div className="card-header bg-dark text-white fw-bold">Agregar Nueva Tarifa</div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-3">
              
              <div className="col-md-6">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Aplicar tarifa a:</label>
                <select 
                  className="form-select"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                >
                  <option value="categoria">Toda una Categoría</option>
                  <option value="vehiculo">Un Vehículo Específico</option>
                </select>
              </div>

              <div className="col-md-6">
                {formData.tipo === 'categoria' ? (
                  <>
                    <label className="form-label" style={{ color: 'var(--rc-text)' }}>Categoría</label>
                    <select 
                      className="form-select"
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                      required
                      style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                    >
                      <option value="">Seleccione categoría</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="form-label" style={{ color: 'var(--rc-text)' }}>Vehículo</label>
                    <select 
                      className="form-select"
                      value={formData.vehiculo_id}
                      onChange={(e) => setFormData({...formData, vehiculo_id: e.target.value})}
                      required
                      style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                    >
                      <option value="">Seleccione vehículo</option>
                      {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>)}
                    </select>
                  </>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Modalidad</label>
                <select 
                  className="form-select"
                  value={formData.modalidad}
                  onChange={(e) => setFormData({...formData, modalidad: e.target.value})}
                  style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                >
                  <option value="HORA">Por Hora</option>
                  <option value="DIA">Por Día</option>
                  <option value="SEMANA">Por Semana</option>
                  <option value="MES">Por Mes</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ color: 'var(--rc-text)' }}>Precio (Bs)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  required 
                  min="1"
                  style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                />
              </div>

            <div className="col-12 mt-4 d-flex gap-2">
                <button type="submit" className="btn btn-dark flex-grow-1">Guardar Tarifa</button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary flex-grow-1"
                  onClick={() => setFormData({ modalidad: 'DIA', precio: '', tipo: 'categoria', categoria_id: '', vehiculo_id: '' })}
                >
                  Cancelar
                </button>
            </div>
            </form>
          </div>
        </div>

        {/* Tabla */}
        <div className="card shadow-sm" style={{ backgroundColor: 'var(--rc-card)' }}>
          <div className="card-header bg-secondary text-white fw-bold">Tarifas Registradas</div>
          <div className="card-body p-0">
            <table className="table table-hover mb-0" style={{ color: 'var(--rc-text)' }}>
              <thead className="table-dark">
                <tr>
                  <th>Aplica a</th>
                  <th>Modalidad</th>
                  <th>Precio (Bs)</th>
                  <th className="text-center">Acciones</th> 
                </tr>
              </thead>
              <tbody>
                {tarifas.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-3">No hay tarifas registradas</td></tr> 
                ) : (
                  tarifas.map((tarifa) => (
                    <tr key={tarifa.id}>
                      <td>
                        {tarifa.categoria_id 
                          ? `Categoría: ${getNombreCategoria(tarifa.categoria_id)}` 
                          : `Vehículo: ${getNombreVehiculo(tarifa.vehiculo_id)}`}
                      </td>
                      <td><span className="badge bg-info text-dark">{tarifa.modalidad}</span></td>
                      <td>
                        {/* 👇 Lógica para editar en línea */}
                        {editandoId === tarifa.id ? (
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={precioEditado}
                            onChange={(e) => setPrecioEditado(e.target.value)}
                            min="1"
                            step="0.01"
                            style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                          />
                        ) : (
                          <strong>{tarifa.precio}</strong>
                        )}
                      </td>
                      <td className="text-center">
                        {editandoId === tarifa.id ? (
                          <>
                            <button className="btn btn-sm btn-success me-2" onClick={() => handleGuardarEdicion(tarifa.id)}>Guardar</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditandoId(null)}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            {/* 👇 Botón de Editar */}
                            <button className="btn btn-sm btn-outline-dark me-2" onClick={() => {
                              setEditandoId(tarifa.id);
                              setPrecioEditado(tarifa.precio);
                            }}>Editar</button>
                            <button className="btn btn-sm btn-danger" onClick={() => eliminarTarifa(tarifa.id)}>Eliminar</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}