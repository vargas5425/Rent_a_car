import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function AdminVehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 5; // Mostraremos 5 autos por página

  const cargarVehiculos = async () => {
    try {
      const res = await api.get('/vehiculos');
      setVehiculos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este vehículo?')) {
      try {
        await api.delete(`/vehiculos/${id}`);
        cargarVehiculos();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  // 1. Lógica de filtrado (por placa, marca o modelo)
  const vehiculosFiltrados = vehiculos.filter(auto => 
    auto.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
    auto.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
    auto.modelo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 2. Lógica de paginación
  const indexUltimo = paginaActual * itemsPorPagina;
  const indexPrimero = indexUltimo - itemsPorPagina;
  const vehiculosPaginados = vehiculosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(vehiculosFiltrados.length / itemsPorPagina);

  // Cambiar de página
  const paginar = (numeroPagina) => setPaginaActual(numeroPagina);

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Link to="/dashboard" className="text-decoration-none text-muted">← Volver al Dashboard</Link>
            <h2 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>Gestión de Vehículos</h2>
          </div>
          
          <div className="d-flex gap-3">
            {/* Buscador */}
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por placa, marca o modelo..." 
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1); // Reiniciar a la primera página al buscar
              }}
              style={{ width: '300px', backgroundColor: 'var(--rc-card)', color: 'var(--rc-text)', borderColor: 'var(--rc-border)' }}
            />
            <Link to="/vehiculos/crear" className="btn btn-dark text-nowrap">+ Nuevo Vehículo</Link>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-5"><div className="spinner-border text-dark" role="status"></div></div>
        ) : (
          <>
            <div className="table-responsive shadow-sm rounded" style={{ backgroundColor: 'var(--rc-card)' }}>
              <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
                <thead className="table-dark">
                  <tr>
                    <th>Vehículo</th>
                    <th>Placa</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculosPaginados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4">No se encontraron vehículos.</td></tr>
                  ) : (
                    vehiculosPaginados.map((auto) => (
                      <tr key={auto.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img src={obtenerUrlImagen(auto.imagen_url)} alt={auto.modelo} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div>
                              <strong>{auto.marca} {auto.modelo}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Año: {auto.anio}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong>{auto.placa}</strong></td>
                        <td>{auto.categoria ? auto.categoria.nombre : 'N/A'}</td>
                        <td>
                          <span className={`badge ${
                            auto.estado === 'DISPONIBLE' ? 'bg-success' : 
                            auto.estado === 'ALQUILADA' ? 'bg-primary' :
                            auto.estado === 'RESERVADA' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {auto.estado}
                          </span>
                        </td>
                        <td className="text-center">
                          <Link to={`/dashboard/admin/vehiculos/${auto.id}/editar`} className="btn btn-sm btn-outline-dark me-2">Editar</Link>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(auto.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginación */}
            {totalPaginas > 1 && (
              <nav className="mt-4">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginar(paginaActual - 1)}>Anterior</button>
                  </li>
                  {[...Array(totalPaginas)].map((_, index) => (
                    <li key={index} className={`page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => paginar(index + 1)}>{index + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginar(paginaActual + 1)}>Siguiente</button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}