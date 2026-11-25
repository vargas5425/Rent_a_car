import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargarCategorias = async () => {
    setCargando(true);
    try {
      const res = await api.get('/categorias');
      setCategorias(Array.isArray(res.data) ? res.data : res.data?.categorias || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las categorías.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(categorias.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const categoriasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return categorias.slice(inicio, inicio + POR_PAGINA);
  }, [categorias, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModal = () => {
    setNombre('');
    setDescripcion('');
    setErrorModal('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setErrorModal('');
    setNombre('');
    setDescripcion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setExito('');

    if (!nombre.trim()) {
      setErrorModal('El nombre de la categoría es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/categorias', {
        nombre: nombre.trim(),
        descripcion: descripcion.trim()
      });
      setModalAbierto(false);
      setNombre('');
      setDescripcion('');
      setExito('Categoría creada exitosamente.');
      await cargarCategorias();
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'No se pudo crear la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container pb-5" style={{ paddingTop: '124px', maxWidth: '900px' }}>
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
              Categorías de vehículos
            </h2>
            <p className="text-secondary mb-0">
              Crea y organiza las categorías para clasificar los vehículos del inventario.
            </p>
          </div>
          <button type="button" className="btn btn-dark text-nowrap" onClick={abrirModal}>
            + Nueva categoría
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {exito && <div className="alert alert-success">{exito}</div>}

        <div
          className="card border-0 shadow-sm"
          style={{ backgroundColor: 'var(--rc-card)', borderColor: 'var(--rc-border)' }}
        >
          <div className="card-header py-3" style={{ backgroundColor: 'var(--rc-card)' }}>
            <h5 className="mb-0 fw-semibold" style={{ color: 'var(--rc-text)' }}>
              Categorías registradas ({categorias.length})
            </h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">N°</th>
                  <th className="text-nowrap">Nombre</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted">
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categoriasPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted">
                      No hay categorías registradas.
                    </td>
                  </tr>
                ) : (
                  categoriasPaginadas.map((cat, idx) => {
                    const numeroFila = (paginaSegura - 1) * POR_PAGINA + idx + 1;
                    return (
                      <tr key={cat.id}>
                        <td className="fw-semibold text-nowrap">{numeroFila}</td>
                        <td className="fw-semibold text-nowrap">{cat.nombre}</td>
                        <td className="text-secondary">{cat.descripcion || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {categorias.length > POR_PAGINA && (
          <nav aria-label="Paginación de categorías" className="mt-4">
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

        {/* Modal para Nueva Categoría */}
        {modalAbierto && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={cerrarModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content"
                style={{ backgroundColor: 'var(--rc-card)', color: 'var(--rc-text)' }}
              >
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title fw-bold">Nueva categoría</h5>
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

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. SUV, Sedan, Pickup"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={guardando}
                        required
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                        Descripción <span className="text-muted fw-normal">(Opcional)</span>
                      </label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Descripción breve de la categoría..."
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        disabled={guardando}
                      />
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
                      {guardando ? 'Guardando...' : 'Crear categoría'}
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