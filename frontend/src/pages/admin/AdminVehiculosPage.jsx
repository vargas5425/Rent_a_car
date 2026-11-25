import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { obtenerUrlImagen } from '../../utils/imagenes';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

const ESTADOS_VEHICULO = ['TODOS', 'DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'MANTENIMIENTO'];

export default function AdminVehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const cargarVehiculos = async () => {
    setCargando(true);
    try {
      const res = await api.get('/vehiculos');
      setVehiculos(Array.isArray(res.data) ? res.data : res.data?.vehiculos || []);
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
        alert(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  // 1. Filtrado por búsqueda y por estado
  const vehiculosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return vehiculos.filter((auto) => {
      const coincideEstado =
        estadoFiltro === 'TODOS' || String(auto.estado || '').toUpperCase() === estadoFiltro;

      if (!coincideEstado) return false;
      if (!q) return true;

      return (
        String(auto.placa || '').toLowerCase().includes(q) ||
        String(auto.marca || '').toLowerCase().includes(q) ||
        String(auto.modelo || '').toLowerCase().includes(q)
      );
    });
  }, [vehiculos, busqueda, estadoFiltro]);

  // 2. Paginación (5 por página)
  const totalPaginas = Math.max(1, Math.ceil(vehiculosFiltrados.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const vehiculosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return vehiculosFiltrados.slice(inicio, inicio + POR_PAGINA);
  }, [vehiculosFiltrados, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container pb-5" style={{ paddingTop: '124px' }}>
        <div className="mb-3">
          <Link
            to="/dashboard"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium"
            style={{
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)',
              backgroundColor: 'var(--rc-card)'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>
              Gestión de Vehículos
            </h2>
            <p className="text-secondary mb-0">
              Filtra por estado o busca por placa, marca o modelo.
            </p>
          </div>

          <Link to="/vehiculos/crear" className="btn btn-dark text-nowrap">
            + Nuevo Vehículo
          </Link>
        </div>

        {/* Filtros: Buscador + Estado */}
        <div
          className="card border-0 shadow-sm p-3 mb-4"
          style={{ backgroundColor: 'var(--rc-card)', borderColor: 'var(--rc-border)' }}
        >
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label
                htmlFor="buscarVehiculo"
                className="form-label small fw-semibold mb-1"
                style={{ color: 'var(--rc-text)' }}
              >
                Buscar vehículo
              </label>
              <input
                id="buscarVehiculo"
                type="text"
                className="form-control"
                placeholder="Buscar por placa, marca o modelo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                style={{
                  backgroundColor: 'var(--rc-bg)',
                  color: 'var(--rc-text)',
                  borderColor: 'var(--rc-border)'
                }}
              />
            </div>

            <div className="col-md-4">
              <label
                htmlFor="filtroEstadoVehiculo"
                className="form-label small fw-semibold mb-1"
                style={{ color: 'var(--rc-text)' }}
              >
                Filtrar por estado
              </label>
              <select
                id="filtroEstadoVehiculo"
                className="form-select"
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value);
                  setPaginaActual(1);
                }}
                style={{
                  backgroundColor: 'var(--rc-bg)',
                  color: 'var(--rc-text)',
                  borderColor: 'var(--rc-border)'
                }}
              >
                {ESTADOS_VEHICULO.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado === 'TODOS' ? 'Todos los estados' : estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              {(busqueda || estadoFiltro !== 'TODOS') && (
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setBusqueda('');
                    setEstadoFiltro('TODOS');
                    setPaginaActual(1);
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" role="status"></div>
            <p className="mt-3 text-secondary">Cargando vehículos...</p>
          </div>
        ) : (
          <>
            <div
              className="table-responsive shadow-sm rounded"
              style={{ backgroundColor: 'var(--rc-card)' }}
            >
              <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
                <thead className="table-dark">
                  <tr>
                    <th>Vehículo</th>
                    <th className="text-nowrap">Placa</th>
                    <th>Categoría</th>
                    <th className="text-nowrap">Estado</th>
                    <th className="text-center text-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-secondary">
                        No se encontraron vehículos con ese filtro.
                      </td>
                    </tr>
                  ) : (
                    vehiculosPaginados.map((auto) => (
                      <tr key={auto.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={obtenerUrlImagen(auto.imagen_url)}
                              alt={auto.modelo}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                            <div>
                              <strong>
                                {auto.marca} {auto.modelo}
                              </strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                Año: {auto.anio}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap">
                          <strong>{auto.placa}</strong>
                        </td>
                        <td>{auto.categoria ? auto.categoria.nombre : 'N/A'}</td>
                        <td className="text-nowrap">
                          <span
                            className={`badge ${
                              auto.estado === 'DISPONIBLE'
                                ? 'bg-success'
                                : auto.estado === 'ALQUILADA'
                                ? 'bg-primary'
                                : auto.estado === 'RESERVADA'
                                ? 'bg-warning text-dark'
                                : 'bg-danger'
                            }`}
                          >
                            {auto.estado}
                          </span>
                        </td>
                        <td className="text-center text-nowrap">
                          <Link
                            to={`/dashboard/admin/vehiculos/${auto.id}/editar`}
                            className="btn btn-sm btn-outline-dark me-2"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
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

            {vehiculosFiltrados.length > POR_PAGINA && (
              <nav
                aria-label="Paginación de vehículos"
                className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4"
              >
                <small className="text-muted">
                  Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–
                  {Math.min(paginaSegura * POR_PAGINA, vehiculosFiltrados.length)} de{' '}
                  {vehiculosFiltrados.length} vehículos
                </small>

                <ul className="pagination mb-0">
                  <li className={`page-item ${paginaSegura === 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => irAPagina(paginaSegura - 1)}
                      disabled={paginaSegura === 1}
                      style={{
                        backgroundColor: 'var(--rc-card)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    >
                      Anterior
                    </button>
                  </li>

                  {Array.from({ length: totalPaginas }, (_, index) => index + 1).map((numeroPagina) => (
                    <li
                      key={numeroPagina}
                      className={`page-item ${paginaSegura === numeroPagina ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => irAPagina(numeroPagina)}
                        style={
                          paginaSegura === numeroPagina
                            ? undefined
                            : {
                                backgroundColor: 'var(--rc-card)',
                                color: 'var(--rc-text)',
                                borderColor: 'var(--rc-border)'
                              }
                        }
                      >
                        {numeroPagina}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${paginaSegura === totalPaginas ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => irAPagina(paginaSegura + 1)}
                      disabled={paginaSegura === totalPaginas}
                      style={{
                        backgroundColor: 'var(--rc-card)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}