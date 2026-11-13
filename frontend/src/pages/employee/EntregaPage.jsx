
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { obtenerMensajeError } from '../../utils/manejarErrores';

export default function EntregaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kilometraje, setKilometraje] = useState('');
  const [combustible, setCombustible] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registrarEntrega = async (e) => {
    e.preventDefault();
    setError('');

    const km = Number(kilometraje);
    const porcentaje = Number(combustible);

    if (
      kilometraje.trim() === '' ||
      !Number.isInteger(km) ||
      km < 0
    ) {
      setError('El kilometraje inicial debe ser un entero mayor o igual a cero.');
      return;
    }

    if (
      combustible.trim() === '' ||
      !Number.isInteger(porcentaje) ||
      porcentaje < 0 ||
      porcentaje > 100
    ) {
      setError('El combustible inicial debe estar entre 0 y 100 %.');
      return;
    }

    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
      setError('El ID del alquiler no es válido.');
      return;
    }

    setEnviando(true);

    try {
        await api.post(`/alquileres/${id}/entrega`, {
        kilometraje_inicial: km,
        combustible_inicial: porcentaje
        });


      navigate('/dashboard/alquileres-activos');
    } catch (err) {
      setError(
        obtenerMensajeError(err, 'No se pudo registrar la entrega.')
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      <Link
        to="/dashboard"
        className="text-decoration-none"
      >
        ← Volver al Dashboard
      </Link>

      <h2 className="fw-bold mt-4">
        Registrar entrega del vehículo
      </h2>

      <p className="text-muted">
        Alquiler #{id}
      </p>

      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-4">
            Datos de entrega
          </h5>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={registrarEntrega}>
            <div className="mb-3">
              <label
                htmlFor="kilometrajeInicial"
                className="form-label fw-semibold"
              >
                Kilometraje inicial (km)
              </label>

              <input
                id="kilometrajeInicial"
                type="number"
                className="form-control"
                min="0"
                step="1"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                placeholder="Ejemplo: 25000"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="combustibleInicial"
                className="form-label fw-semibold"
              >
                Combustible inicial (%)
              </label>

              <input
                id="combustibleInicial"
                type="number"
                className="form-control"
                min="0"
                max="100"
                step="1"
                value={combustible}
                onChange={(e) => setCombustible(e.target.value)}
                placeholder="Ejemplo: 100"
                required
              />

              <small className="text-muted">
                Ingresa un porcentaje entre 0 y 100.
              </small>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={enviando}
              >
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
