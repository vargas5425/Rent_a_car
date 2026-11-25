import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const POR_PAGINA = 5;

const FORM_INICIAL = {
  nombre: '',
  email: '',
  password: '',
  rol: 'CLIENTE',
  activo: true
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [errorModal, setErrorModal] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(Array.isArray(res.data?.usuarios) ? res.data.usuarios : []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(usuarios.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return usuarios.slice(inicio, inicio + POR_PAGINA);
  }, [usuarios, paginaSegura]);

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPaginaActual(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirNuevoModal = () => {
    setErrorModal('');
    setEditandoId(null);
    setFormData(FORM_INICIAL);
    setModalAbierto(true);
  };

  const iniciarEdicion = (u) => {
    setError('');
    setExito('');
    setErrorModal('');
    setEditandoId(u.id);
    setFormData({
      nombre: u.nombre || '',
      email: u.email || '',
      password: '',
      rol: u.rol || 'CLIENTE',
      activo: Boolean(u.activo)
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setErrorModal('');
    setEditandoId(null);
    setFormData(FORM_INICIAL);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setErrorModal('');
    setGuardando(true);

    try {
      if (editandoId) {
        const payload = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          rol: formData.rol,
          activo: Boolean(formData.activo)
        };
        if (formData.password.trim() !== '') {
          payload.password = formData.password;
        }
        await api.put(`/usuarios/${editandoId}`, payload);
        setExito('Usuario actualizado exitosamente.');
      } else {
        await api.post('/usuarios', {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          rol: formData.rol,
          activo: Boolean(formData.activo)
        });
        setExito('Usuario creado exitosamente.');
      }
      setModalAbierto(false);
      setEditandoId(null);
      setFormData(FORM_INICIAL);
      await cargarUsuarios();
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'No se pudo guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (u) => {
    const ok = window.confirm(`¿Eliminar al usuario "${u.nombre}" (${u.email})?`);
    if (!ok) return;

    setError('');
    setExito('');
    try {
      await api.delete(`/usuarios/${u.id}`);
      if (editandoId === u.id) {
        setEditandoId(null);
        setFormData(FORM_INICIAL);
      }
      setExito('Usuario eliminado exitosamente.');
      await cargarUsuarios();
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el usuario.');
    }
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

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>
              Gestión de usuarios
            </h2>
            <p className="text-secondary mb-0">
              Crea, edita, activa/desactiva o elimina cuentas de clientes, empleados y administradores.
            </p>
          </div>
          <button type="button" className="btn btn-dark text-nowrap" onClick={abrirNuevoModal}>
            + Nuevo usuario
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {exito && (
          <div className="alert alert-success" role="alert">
            {exito}
          </div>
        )}

        <div
          className="card border-0 shadow-sm"
          style={{ backgroundColor: 'var(--rc-card)', borderColor: 'var(--rc-border)' }}
        >
          <div className="card-header py-3" style={{ backgroundColor: 'var(--rc-card)' }}>
            <h5 className="mb-0 fw-semibold" style={{ color: 'var(--rc-text)' }}>
              Usuarios registrados ({usuarios.length})
            </h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">N°</th>
                  <th>Nombre / Correo</th>
                  <th className="text-nowrap">Rol</th>
                  <th className="text-nowrap">Estado</th>
                  <th className="text-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : usuariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((u, idx) => {
                    const numeroFila = (paginaSegura - 1) * POR_PAGINA + idx + 1;
                    return (
                      <tr key={u.id}>
                        <td className="fw-semibold text-nowrap">{numeroFila}</td>
                        <td>
                          <div className="fw-semibold">{u.nombre}</div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td className="text-nowrap">
                          <span className="badge bg-secondary">{u.rol}</span>
                        </td>
                        <td className="text-nowrap">
                          <span className={`badge ${u.activo ? 'bg-success' : 'bg-danger'}`}>
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="text-nowrap">
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => iniciarEdicion(u)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleEliminar(u)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {usuarios.length > POR_PAGINA && (
          <nav aria-label="Paginación de usuarios" className="mt-4">
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

        {/* Modal para Crear / Editar Usuario */}
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
                  <h5 className="modal-title fw-bold">
                    {editandoId ? 'Editar usuario' : 'Nuevo usuario'}
                  </h5>
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
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        disabled={guardando}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={guardando}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                        Contraseña{' '}
                        {editandoId && (
                          <span className="text-muted fw-normal">(Dejar vacío para mantener)</span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={guardando}
                        required={!editandoId}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: 'var(--rc-text)' }}>
                        Rol
                      </label>
                      <select
                        className="form-select"
                        value={formData.rol}
                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                        disabled={guardando}
                      >
                        <option value="CLIENTE">CLIENTE</option>
                        <option value="EMPLEADO">EMPLEADO</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      </select>
                    </div>

                    <div className="form-check mb-0">
                      <input
                        id="usuarioActivo"
                        type="checkbox"
                        className="form-check-input"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        disabled={guardando}
                      />
                      <label htmlFor="usuarioActivo" className="form-check-label">
                        Usuario activo
                      </label>
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
                      {guardando
                        ? 'Guardando...'
                        : editandoId
                        ? 'Guardar cambios'
                        : 'Crear usuario'}
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