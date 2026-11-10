import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function AdminVehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);

  // Función manual para recargar la tabla (útil después de eliminar)
  const cargarVehiculos = async () => {
    try {
      const res = await api.get('/vehiculos');
      setVehiculos(res.data);
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
    }
  };

  // Efecto inicial corregido para evitar advertencias de ESLint
  useEffect(() => {
    let isMounted = true;
    const fetchVehiculos = async () => {
      try {
        const res = await api.get('/vehiculos');
        if (isMounted) {
          setVehiculos(res.data);
        }
      } catch (err) {
        console.error('Error al cargar vehículos:', err);
      }
    };

    fetchVehiculos();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este vehículo?')) {
      try {
        await api.delete(`/vehiculos/${id}`);
        cargarVehiculos(); // Recargar la tabla después de borrar
      } catch (err) {
        const msg = err.response?.data?.error || 'Error al eliminar el vehículo';
        alert(msg);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px', minHeight: '80vh', backgroundColor: 'var(--rc-bg)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Gestión de Vehículos (Admin)</h2>
          <Link to="/vehiculos/crear" className="btn btn-dark">
            + Nuevo Vehículo
          </Link>
        </div>

        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Placa</th>
                <th>Marca / Modelo</th>
                <th>Año</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No hay vehículos registrados.
                  </td>
                </tr>
              ) : (
                vehiculos.map((auto) => (
                  <tr key={auto.id}>
                    <td><strong>{auto.placa}</strong></td>
                    <td>{auto.marca} {auto.modelo}</td>
                    <td>{auto.anio}</td>
                    <td>{auto.categoria ? auto.categoria.nombre : 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        auto.estado === 'DISPONIBLE' ? 'bg-success' : 
                        auto.estado === 'ALQUILADA' ? 'bg-primary' :
                        auto.estado === 'RESERVADA' ? 'bg-warning text-dark' : 
                        'bg-danger'
                      }`}>
                        {auto.estado}
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleEliminar(auto.id)}
                      >
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