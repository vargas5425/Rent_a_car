import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarMisReservas, cancelarReserva } from '../../services/reservasService';
import { formatearFecha, formatearBs, ETIQUETA_ESTADO } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

const ITEMS_POR_PAGINA = 6;

export default function MisReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  // Filtros y paginación
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const cargar = async () => {
      try {
        const datos = await listarMisReservas();
        if (isMounted) setReservas(Array.isArray(datos) ? datos : []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || 'Error al cargar tus reservas.');
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargar();
    return () => { isMounted = false; };
  }, [recarga]);

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    try {
      await cancelarReserva(id);
      setError('');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cancelar la reserva.');
    }
  };

  const reservasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return reservas.filter((r) => {
      const cumpleEstado = filtroEstado === 'TODOS' || r.estado === filtroEstado;
      if (!cumpleEstado) return false;

      if (!termino) return true;
      const vehiculoTxt = r.vehiculo
        ? `${r.vehiculo.marca || ''} ${r.vehiculo.modelo || ''} ${r.vehiculo.placa || ''}`.toLowerCase()
        : '';
      const refTxt = `r-${r.id} ${r.id}`.toLowerCase();
      return vehiculoTxt.includes(termino) || refTxt.includes(termino);
    });
  }, [reservas, busqueda, filtroEstado]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(reservasFiltradas.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const reservasPaginadas = reservasFiltradas.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  const resumenContadores = useMemo(() => {
    const activas = reservas.filter((r) =>
      ['RESERVADA', 'CONFIRMADA', 'ENTREGADA'].includes(r.estado)
    ).length;
    const finalizadas = reservas.filter((r) => r.estado === 'FINALIZADO' || r.estado === 'FINALIZADA').length;
    return { total: reservas.length, activas, finalizadas };
  }, [reservas]);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>Mis reservas</h1>
            <p className="text-muted mb-0">
              Administra tus solicitudes, consulta horarios de entrega y revisa el estado de cada viaje.
            </p>
          </div>
          <Link to="/vehiculos" className="btn btn-dark px-4 py-2 fw-semibold">+ Nueva reserva</Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {cargando && <p className="text-muted">Cargando tus reservas...</p>}

        {!cargando && reservas.length === 0 && !error && (
          <div className="card p-5 text-center">
            <h5 className="fw-bold" style={{ color: 'var(--rc-text)' }}>Todavía no tienes reservas</h5>
            <p className="text-muted mb-4">Elige un vehículo de nuestra flota y reserva tu próximo viaje.</p>
            <div><Link to="/vehiculos" className="btn btn-dark">Ver la flota</Link></div>
          </div>
        )}

        {reservas.length > 0 && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 h-100" style={{ backgroundColor: 'var(--rc-card)' }}>
                  <div className="card-body py-3">
                    <small className="text-muted d-block">Total de reservas</small>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>
                      {resumenContadores.total}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 h-100" style={{ backgroundColor: 'var(--rc-card)' }}>
                  <div className="card-body py-3">
                    <small className="text-muted d-block">En curso / Pendientes</small>
                    <h4 className="fw-bold mb-0 text-primary">
                      {resumenContadores.activas}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="card border-0 shadow-sm rounded-3 h-100" style={{ backgroundColor: 'var(--rc-card)' }}>
                  <div className="card-body py-3">
                    <small className="text-muted d-block">Completadas</small>
                    <h4 className="fw-bold mb-0 text-success">
                      {resumenContadores.finalizadas}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3" style={{ backgroundColor: 'var(--rc-card)' }}>
              <div className="card-body py-3 px-4">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por vehículo, placa o N° de reserva..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      style={{
                        backgroundColor: 'var(--rc-bg)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <select
                      className="form-select"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      style={{
                        backgroundColor: 'var(--rc-bg)',
                        color: 'var(--rc-text)',
                        borderColor: 'var(--rc-border)'
                      }}
                    >
                      <option value="TODOS">Todos los estados</option>
                      {Object.entries(ETIQUETA_ESTADO).map(([clave, etiqueta]) => (
                        <option key={clave} value={clave}>{etiqueta}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-2 text-md-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setBusqueda('');
                        setFiltroEstado('TODOS');
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {reservasFiltradas.length === 0 ? (
              <div className="card p-4 text-center text-muted" style={{ backgroundColor: 'var(--rc-card)' }}>
                No se encontraron reservas con los filtros aplicados.
              </div>
            ) : (
              <>
                <div className="table-responsive shadow-sm rounded" style={{ backgroundColor: 'var(--rc-card)' }}>
                  <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: '90px' }}>N°</th>
                        <th>Vehículo</th>
                        <th>Periodo de alquiler</th>
                        <th className="text-center" style={{ width: '130px' }}>Modalidad</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservasPaginadas.map((r, index) => {
                        const esCancelable = r.estado === 'RESERVADA';
                        return (
                          <tr key={r.id}>
                            <td>
                              <div className="fw-bold">{indiceInicio + index + 1}</div>
                              <small className="text-muted">R-{r.id}</small>
                            </td>
                            <td>
                              {r.vehiculo ? (
                                <div>
                                  <div className="fw-semibold">
                                    {r.vehiculo.marca} {r.vehiculo.modelo}
                                  </div>
                                  {r.vehiculo.placa && (
                                    <small className="text-muted">{r.vehiculo.placa}</small>
                                  )}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: '0.9rem' }}>
                                <i className="fa fa-calendar-check-o text-muted me-2" title="Recogida" aria-hidden="true"></i>
                                {formatearFecha(r.fecha_inicio)}
                              </div>
                              <div style={{ fontSize: '0.9rem' }}>
                                <i className="fa fa-calendar-o text-muted me-2" title="Devolución" aria-hidden="true"></i>
                                {formatearFecha(r.fecha_fin)}
                              </div>
                            </td>
                            <td className="text-center">
                              <span
                                className="badge bg-light text-dark border d-inline-block"
                                style={{ minWidth: '82px', padding: '6px 10px' }}
                              >
                                {r.modalidad || '—'}
                              </span>
                            </td>
                            <td>{formatearBs(r.total)}</td>
                            <td><EstadoBadge estado={r.estado} /></td>
                            <td className="text-center">
                              <div className="d-inline-flex gap-2">
                                <Link to={`/reservas/${r.id}`} className="btn btn-sm btn-outline-dark">
                                  Ver
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={!esCancelable}
                                  title={
                                    esCancelable
                                      ? 'Cancelar reserva'
                                      : 'Solo se puede cancelar en estado Reservada'
                                  }
                                  onClick={() => handleCancelar(r.id)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav aria-label="Paginación de mis reservas">
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${paginaSegura === 1 ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                          >
                            Anterior
                          </button>
                        </li>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                          <li
                            key={num}
                            className={`page-item ${num === paginaSegura ? 'active' : ''}`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setPaginaActual(num)}
                            >
                              {num}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${paginaSegura === totalPaginas ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                          >
                            Siguiente
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}