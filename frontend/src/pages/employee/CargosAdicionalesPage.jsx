
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const TIPOS_CARGO = [
  { valor: 'DANIO', nombre: 'Daños en el vehículo' },
  { valor: 'LIMPIEZA', nombre: 'Limpieza extraordinaria' },
  { valor: 'KILOMETRAJE', nombre: 'Kilometraje excedido' },
  { valor: 'OTRO', nombre: 'Otro concepto' }
];

function CargosAdicionalesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState('DANIO');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const registrarCargo = async (e) => {
    e.preventDefault();

    if (guardando || resultado) return;

    setError('');

    const montoNumero = Number(monto);

    if (!descripcion.trim()) {
      setError('Debes ingresar una descripción.');
      return;
    }

    if (
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(monto.trim())
    ) {
      setError('Ingresa un monto positivo con máximo dos decimales.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError('No se encontró una sesión activa.');
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await axios.post(
        `${API_URL}/alquileres/${id}/cargos-adicionales`,
        {
          tipo,
          descripcion: descripcion.trim(),
          monto: montoNumero
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResultado(respuesta.data);
    } catch (err) {
      console.error('Error al registrar cargo adicional:', err);

      setError(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        'No se pudo registrar el cargo adicional.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="container py-4">
      <Link
        to="/dashboard/alquileres-activos"
        className="btn btn-outline-secondary mb-4"
      >
        Volver a alquileres activos
      </Link>

      <h2 className="fw-bold mb-2">
        Registrar cargo adicional
      </h2>

      <p className="text-secondary mb-4">
        Alquiler #{id}
      </p>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {resultado ? (
            <>
              <div className="alert alert-success">
                {resultado.mensaje}
              </div>

              <h4 className="mb-3">
                Resumen del cargo
              </h4>

              <p>
                <strong>Tipo:</strong>{' '}
                {resultado.cargo?.tipo}
              </p>

              <p>
                <strong>Descripción:</strong>{' '}
                {resultado.cargo?.descripcion}
              </p>

              <p>
                <strong>Monto:</strong>{' '}
                Bs {Number(resultado.cargo?.monto || 0).toFixed(2)}
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  navigate('/dashboard/alquileres-activos')
                }
              >
                Volver al listado
              </button>
            </>
          ) : (
            <form onSubmit={registrarCargo}>

              <div className="mb-3">
                <label
                  htmlFor="tipo"
                  className="form-label fw-semibold"
                >
                  Tipo de cargo
                </label>

                <select
                  id="tipo"
                  className="form-select"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={guardando}
                >
                  {TIPOS_CARGO.map((opcion) => (
                    <option
                      key={opcion.valor}
                      value={opcion.valor}
                    >
                      {opcion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="descripcion"
                  className="form-label fw-semibold"
                >
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  className="form-control"
                  rows="4"
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(e.target.value)
                  }
                  placeholder="Describe el motivo del cargo..."
                  disabled={guardando}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="monto"
                  className="form-label fw-semibold"
                >
                  Monto (Bs)
                </label>

                <input
                  id="monto"
                  type="number"
                  className="form-control"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ejemplo: 150.00"
                  disabled={guardando}
                  required
                />
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Registrando...'
                    : 'Registrar cargo'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    navigate('/dashboard/alquileres-activos')
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default CargosAdicionalesPage;
