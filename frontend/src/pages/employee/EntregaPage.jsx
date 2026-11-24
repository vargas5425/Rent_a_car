import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';

export default function EntregaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [kilometraje, setKilometraje] = useState('');
  const [combustible, setCombustible] = useState('');
  const [deposito, setDeposito] = useState(''); // 👈 NUEVO
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registrarEntrega = async (e) => {
    e.preventDefault();
    setError('');

    const km = Number(kilometraje);
    const porcentaje = Number(combustible);
    const depositoNum = deposito.trim() === '' ? 0 : Number(deposito);

    if (kilometraje.trim() === '' || !Number.isInteger(km) || km < 0) {
      setError('El kilometraje inicial debe ser un entero mayor o igual a cero.');
      return;
    }

    if (combustible.trim() === '' || !Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      setError('El combustible inicial debe estar entre 0 y 100 %.');
      return;
    }

    if (deposito.trim() !== '' && (!Number.isFinite(depositoNum) || depositoNum < 0)) {
      setError('El depósito/garantía debe ser un número positivo o cero.');
      return;
    }

    setEnviando(true);

    try {
      await api.patch(`/alquileres/${id}/entrega`, {
        kilometraje_inicial: km,
        combustible_inicial: porcentaje,
        deposito_garantia: depositoNum, // 👈 NUEVO
        observaciones_entrega: observaciones.trim()
      });

      navigate('/dashboard/alquileres-activos');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        'No se pudo registrar la entrega.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      <Link to="/dashboard" className="text-decoration-none">
        ← Volver al Dashboard
      </Link>

      <h2 className="fw-bold mt-4">Registrar entrega del vehículo</h2>
      <p className="text-muted">
        Alquiler #{id}
        {usuario?.nombre ? ` • Responsable: ${usuario.nombre}` : ''}
      </p>

      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-4">Datos de entrega</h5>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form onSubmit={registrarEntrega}>
            <div className="mb-3">
              <label htmlFor="kilometrajeInicial" className="form-label fw-semibold">
                Kilometraje inicial (km)
              </label>
              <input
                id="kilometrajeInicial"
                type="number"
                className="form-control"
                min="0"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                placeholder="Ejemplo: 25000"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="combustibleInicial" className="form-label fw-semibold">
                Combustible inicial (%)
              </label>
              <input
                id="combustibleInicial"
                type="number"
                className="form-control"
                min="0"
                max="100"
                value={combustible}
                onChange={(e) => setCombustible(e.target.value)}
                placeholder="Ejemplo: 100"
                required
              />
              <small className="text-muted">Ingresa un porcentaje entre 0 y 100.</small>
            </div>

            {/* 👇 NUEVO CAMPO */}
            <div className="mb-3">
              <label htmlFor="depositoGarantia" className="form-label fw-semibold">
                Depósito / Garantía (Bs) <span className="text-muted fw-normal">(Opcional)</span>
              </label>
              <input
                id="depositoGarantia"
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                value={deposito}
                onChange={(e) => setDeposito(e.target.value)}
                placeholder="Ejemplo: 500.00"
              />
              <small className="text-muted">Dejalo vacío si no se cobra garantía.</small>
            </div>

            <div className="mb-4">
              <label htmlFor="observacionesEntrega" className="form-label fw-semibold">
                Observaciones del estado del vehículo al entregar
              </label>
              <textarea
                id="observacionesEntrega"
                rows="3"
                className="form-control"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Rayones leves, llantas, accesorios incluidos, limpieza..."
              />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Registrando...' : 'Registrar entrega'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}