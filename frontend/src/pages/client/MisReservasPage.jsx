import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarMisReservas, cancelarReserva } from '../../services/reservasService';
import { formatearFecha, formatearBs, puedeCancelar } from '../../utils/reservas';
import EstadoBadge from '../../components/reservas/EstadoBadge';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';

export default function MisReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const cargar = async () => {
      try {
        const datos = await listarMisReservas();
        if (isMounted) setReservas(datos);
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

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--rc-bg)' }}>
      <Navbar />

      <div className="container py-5 flex-grow-1" style={{ marginTop: '80px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mb-0" style={{ color: 'var(--rc-text)' }}>Mis reservas</h1>
          <Link to="/vehiculos" className="btn btn-dark">+ Nueva reserva</Link>
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
          <div className="table-responsive shadow-sm rounded" style={{ backgroundColor: 'var(--rc-card)' }}>
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--rc-text)' }}>
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Vehículo</th>
                  <th>Recogida</th>
                  <th>Devolución</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : '—'}</td>
                    <td>{formatearFecha(r.fecha_inicio)}</td>
                    <td>{formatearFecha(r.fecha_fin)}</td>
                    <td>{formatearBs(r.total)}</td>
                    <td><EstadoBadge estado={r.estado} /></td>
                    <td className="text-center">
                      <Link to={`/reservas/${r.id}`} className="btn btn-sm btn-outline-dark me-2">Ver</Link>
                      {puedeCancelar(r.estado) && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(r.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}