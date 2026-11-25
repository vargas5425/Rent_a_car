import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tarifaService } from '../../services/tarifaService';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 8;

const FORM_INICIAL = {
  modalidad: 'DIA',
  precio: '',
  tipo: 'categoria',
  categoria_id: '',
  vehiculo_id: ''
};

export default function AdminTarifasPage() {
  const [tarifas, setTarifas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados para la edición en línea
  const [editandoId, setEditandoId] = useState(null);
  const [precioEditado, setPrecioEditado] = useState('');

  const cargarDatos = async () => {
    try {
      const [resTarifas, resCategorias, resVehiculos] = await Promise.all([
        tarifaService.listar(),
        api.get('/categorias'),
        api.get('/vehiculos')
      ]);
      setTarifas(Array.isArray(resTarifas) ? resTarifas : []);
      setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);
      setVehiculos(Array.isArray(resVehiculos.data) ? resVehiculos.data : []);
    } catch (error) {
      console.error('Error al cargar datos', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(tarifas.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const tarifasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return tarifas.slice(inicio, inicio + POR_PAGINA);
  }, [tarifas, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModal = () => {
    setErrorModal('');
    setFormData(FORM_INICIAL);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setErrorModal('');
    setFormData(FORM_INICIAL);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setMensaje('');
    setGuardando(true);

    try {
      const payload = {
        modalidad: formData.modalidad,
        precio: parseFloat(formData.precio),
        categoria_id: formData.tipo === 'categoria' ? parseInt(formData.categoria_id, 10) : null,
        vehiculo_id: formData.tipo === 'vehiculo' ? parseInt(formData.vehiculo_id, 10) : null
      };

      await tarifaService.crear(payload);
      setModalAbierto(false);
      setFormData(FORM_INICIAL);
      setMensaje('¡Tarifa creada con éxito!');
      await cargarDatos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setErrorModal(error.response?.data?.error || error.message || 'No se pudo crear la tarifa.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTarifa = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarifa?')) {
      try {
        await tarifaService.eliminar(id);
        await cargarDatos();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const handleGuardarEdicion = async (id) => {
    try {
      await api.put(`/tarifas/${id}`, { precio: parseFloat(precioEditado) });
      setEditandoId(null);
      await cargarDatos();
    } catch (error) {
      alert('Error al actualizar la tarifa');
    }
  };

  const getNombreCategoria = (id) => {
    const cat = categorias.find((c) => c.id === id);
    return cat ? cat.nombre : `Categoría #${id}`;
  };

  const getNombreVehiculo = (id) => {
    const v = vehiculos.find((veh) => veh.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placa})` : `Vehículo #${id}`;
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />

      <main className="container pb-5" style={{ paddingTop: '124px', maxWidth: '960px' }}>
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

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>
              Gestión de Tarifas
            </h2>
            <p className="text-secondary mb-0">
              Configura tarifas por categoría o vehículo según la modalidad de alquiler.
            </p>
          </div>
          <button type="button" className="btn btn-dark text-nowrap" onClick={abrirModal}>
            + Agregar tarifa
          </button>
        </div>

        {mensaje && <div className="alert alert-success">{mensaje}</div>}

        {/* Tabla */}
        <div className="card shadow-sm" style={{ backgroundColor: 'var(--rc-card)' }}>
          <div className="card-header bg-secondary text-white fw-bold">
            Tarifas Registradas ({tarifas.length})
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
                <thead className="table-dark">
                  <tr>
                    <th>Aplica a</th>
                    <th className="text-nowrap">Modalidad</th>
                    <th className="text-nowrap">Precio (Bs)</th>
                    <th className="text-center text-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-secondary">
                        Cargando tarifas...
                      </td>
                    </tr>
                  ) : tarifasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-secondary">
                        No hay tarifas registradas
                      </td>
                    </tr>
                  ) : (
                    tarifasPaginadas.map((tarifa) => (
                      <tr key={tarifa.id}>
                        <td>
                          {tarifa.categoria_id
                            ? `Categoría: ${getNombreCategoria(tarifa.categoria_id)}`
                            : `Vehículo: ${getNombreVehiculo(tarifa.vehiculo_id)}`}
                        </td>
                        <td className="text-nowrap">
                          <span className="badge bg-info text-dark">{tarifa.modalidad}</span>
                        </td>
                        <td className="text-nowrap">
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
                            <strong>Bs {Number(tarifa.precio).toFixed(2)}</strong>
                          )}
                        </td>
                        <td className="text-center text-nowrap">
                          {editandoId === tarifa.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleGuardarEdicion(tarifa.id)}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setEditandoId(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => {
                                  setEditandoId(tarifa.id);
                                  setPrecioEditado(tarifa.precio);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => eliminarTarifa(tarifa.id)}
                              >
                                Eliminar
                              </button>
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

        {tarifas.length > POR_PAGINA && (
          <nav aria-label="Paginación de tarifas" className="mt-4">
            <ul className="pagination justify-content-center mb-0">
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

              {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((num) => (
                <li
                  key={num}
                  className={`page-item ${paginaSegura === num ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => irAPagina(num)}
                    style={
                      paginaSegura === num
                        ? undefined
                        : {
                            backgroundColor: 'var(--rc-card)',
                            color: 'var(--rc-text)',
                            borderColor: 'var(--rc-border)'
                          }
                    }
                  >
                    {num}
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

        {/* Modal para Agregar Nueva Tarifa */}
        {modalAbierto && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={cerrarModal}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content"
                style={{ backgroundColor: 'var(--rc-card)', color: 'var(--rc-text)' }}
              >
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title fw-bold">Agregar Nueva Tarifa</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cerrarModal}
                    disabled={guardando}
                  />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {errorModal && (
                      <div className="alert alert-danger" role="alert">
                        {errorModal}
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: 'var(--rc-text)' }}>
                          Aplicar tarifa a:
                        </label>
                        <select
                          className="form-select"
                          value={formData.tipo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tipo: e.target.value,
                              categoria_id: '',
                              vehiculo_id: ''
                            })
                          }
                          disabled={guardando}
                          style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                        >
                          <option value="categoria">Toda una Categoría</option>
                          <option value="vehiculo">Un Vehículo Específico</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        {formData.tipo === 'categoria' ? (
                          <>
                            <label className="form-label" style={{ color: 'var(--rc-text)' }}>
                              Categoría
                            </label>
                            <select
                              className="form-select"
                              value={formData.categoria_id}
                              onChange={(e) =>
                                setFormData({ ...formData, categoria_id: e.target.value })
                              }
                              required
                              disabled={guardando}
                              style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                            >
                              <option value="">Seleccione categoría</option>
                              {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <label className="form-label" style={{ color: 'var(--rc-text)' }}>
                              Vehículo
                            </label>
                            <select
                              className="form-select"
                              value={formData.vehiculo_id}
                              onChange={(e) =>
                                setFormData({ ...formData, vehiculo_id: e.target.value })
                              }
                              required
                              disabled={guardando}
                              style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                            >
                              <option value="">Seleccione vehículo</option>
                              {vehiculos.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.marca} {v.modelo} ({v.placa})
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={{ color: 'var(--rc-text)' }}>
                          Modalidad
                        </label>
                        <select
                          className="form-select"
                          value={formData.modalidad}
                          onChange={(e) =>
                            setFormData({ ...formData, modalidad: e.target.value })
                          }
                          disabled={guardando}
                          style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                        >
                          <option value="HORA">Por Hora</option>
                          <option value="DIA">Por Día</option>
                          <option value="SEMANA">Por Semana</option>
                          <option value="MES">Por Mes</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={{ color: 'var(--rc-text)' }}>
                          Precio (Bs)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.precio}
                          onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                          required
                          min="1"
                          step="0.01"
                          disabled={guardando}
                          style={{ backgroundColor: 'var(--rc-bg)', color: 'var(--rc-text)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cerrarModal}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-dark" disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar Tarifa'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}