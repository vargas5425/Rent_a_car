import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  listarTodasLasReservas,
  confirmarReserva,
  cancelarReserva
} from '../../services/reservasService';
import { ESTADOS_RESERVA, ETIQUETA_ESTADO, formatearFecha, formatearBs, puedeCancelar } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import Navbar from '../../components/layout/Navbar/Navbar';

// Pantalla del empleado / administrador: todas las reservas, con filtro por estado.
export default function GestionReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const cargar = async () => {
      try {
        const datos = await listarTodasLasReservas();
        if (isMounted) setReservas(datos);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || 'Error al cargar las reservas.');
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    cargar();

    return () => {
      isMounted = false;
    };
  }, [recarga]);

  const ejecutar = async (accion, id, mensajeError) => {
    try {
      await accion(id);
      setError('');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.error || mensajeError);
    }
  };

  const handleCancelar = (id) => {
    if (window.confirm('¿Seguro que deseas cancelar esta reserva?')) {
      ejecutar(cancelarReserva, id, 'No se pudo cancelar la reserva.');
    }
  };

  const visibles = filtro === 'TODAS' ? reservas : reservas.filter((r) => r.estado === filtro);

  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px', minHeight: '80vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Link to="/dashboard" className="text-decoration-none text-muted">← Dashboard</Link>
            <h2 className="fw-bold mb-0">Gestión de Reservas</h2>
          </div>
          <select
            className="form-select w-auto"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="TODAS">Todos los estados</option>
            {[...ESTADOS_RESERVA, 'CANCELADA'].map((estado) => (
              <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {cargando && <p className="text-muted">Cargando reservas...</p>}

        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Recogida</th>
                <th>Devolución</th>
                <th>Total</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!cargando && visibles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No hay reservas para mostrar.
                  </td>
                </tr>
              ) : (
                visibles.map((r) => (
                  <tr key={r.id} data-testid="reserva-fila">
                    <td><strong>{r.id}</strong></td>
                    <td>{r.usuario ? r.usuario.nombre : '—'}</td>
                    <td>{r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : '—'}</td>
                    <td>{formatearFecha(r.fecha_inicio)}</td>
                    <td>{formatearFecha(r.fecha_fin)}</td>
                    <td>{formatearBs(r.total)}</td>
                    <td><EstadoBadge estado={r.estado} /></td>
                    <td className="text-center text-nowrap">
                      <Link to={`/reservas/${r.id}`} className="btn btn-sm btn-outline-dark me-2">Ver</Link>
                      {r.estado === 'RESERVADA' && (
                        <button
                          className="btn btn-sm btn-dark me-2"
                          onClick={() => ejecutar(confirmarReserva, r.id, 'No se pudo confirmar la reserva.')}
                        >
                          Confirmar
                        </button>
                      )}
                      {puedeCancelar(r.estado) && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(r.id)}>
                          Cancelar
                        </button>
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
  );
}
