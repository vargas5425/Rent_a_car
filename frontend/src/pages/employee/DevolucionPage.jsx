
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './DevolucionPage.css';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

function DevolucionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alquiler, setAlquiler] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const [formulario, setFormulario] = useState({
    kilometraje_final: '',
    combustible_final: '',
    requiere_mantenimiento: false,
    observaciones_devolucion: ''
  });

  useEffect(() => {
    let activo = true;

    async function cargarAlquiler() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No se encontró una sesión activa.');
        }

        const respuesta = await axios.get(
          `${API_URL}/alquileres/activos`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const encontrado = (
          respuesta.data.alquileres || []
        ).find((item) => String(item.id) === String(id));

        if (!encontrado) {
          throw new Error('No se encontró un alquiler activo con ese ID.');
        }

        if (activo) {
          setAlquiler(encontrado);
          setFormulario((anterior) => ({
            ...anterior,
            kilometraje_final:
              String(encontrado.kilometraje_inicial ?? ''),
            combustible_final:
              String(encontrado.combustible_inicial ?? '')
          }));
        }
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.mensaje ||
            err.message ||
            'No se pudo cargar el alquiler.'
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarAlquiler();

    return () => {
      activo = false;
    };
  }, [id]);

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const registrarDevolucion = async (event) => {
    event.preventDefault();
    setError('');

    const kilometraje = Number(formulario.kilometraje_final);
    const combustible = Number(formulario.combustible_final);

    if (
      formulario.kilometraje_final === '' ||
      !Number.isInteger(kilometraje) ||
      kilometraje < Number(alquiler.kilometraje_inicial)
    ) {
      setError(
        'El kilometraje final debe ser igual o mayor al inicial.'
      );
      return;
    }

    if (
      formulario.combustible_final === '' ||
      !Number.isInteger(combustible) ||
      combustible < 0 ||
      combustible > 100
    ) {
      setError('El combustible debe estar entre 0 y 100.');
      return;
    }

    if (!formulario.observaciones_devolucion.trim()) {
      setError('Debes ingresar las observaciones de devolución.');
      return;
    }

    try {
      setGuardando(true);

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No se encontró una sesión activa.');
      }

      const respuesta = await axios.post(
        `${API_URL}/alquileres/${id}/devolucion`,
        {
          kilometraje_final: kilometraje,
          combustible_final: combustible,
          requiere_mantenimiento:
            formulario.requiere_mantenimiento,
          observaciones_devolucion:
            formulario.observaciones_devolucion.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResultado(respuesta.data);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.message ||
        'No se pudo registrar la devolución.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatoBs = (valor) =>
    `Bs ${Number(valor || 0).toFixed(2)}`;

  if (cargando) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Cargando alquiler...</p>
      </main>
    );
  }

  return (
    <main className="container py-4 devolucion-page">
      <button
        type="button"
        className="btn btn-outline-secondary mb-4"
        onClick={() =>
          navigate('/dashboard/alquileres-activos')
        }
      >
        Volver a alquileres activos
      </button>

      <h2 className="fw-bold mb-2">
        Registrar devolución
      </h2>

      <p className="text-secondary mb-4">
        Alquiler #{id}
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {resultado ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="alert alert-success">
              {resultado.mensaje ||
                'Devolución registrada correctamente.'}
            </div>

            <h5 className="fw-bold mb-3">
              Resumen de devolución
            </h5>

            <p>
              <strong>Estado del vehículo:</strong>{' '}
              {resultado.vehiculo?.estado}
            </p>

            <p>
              <strong>Horas de retraso:</strong>{' '}
              {resultado.retraso?.horas_retraso ?? 0}
            </p>

            <p>
              <strong>Cargo por retraso:</strong>{' '}
              {formatoBs(resultado.retraso?.monto)}
            </p>

            <p>
              <strong>Combustible faltante:</strong>{' '}
              {resultado.combustible?.combustible_faltante ?? 0}%
            </p>

            <p>
              <strong>Cargo por combustible:</strong>{' '}
              {formatoBs(resultado.combustible?.monto)}
            </p>

            <hr />

            <h4 className="fw-bold">
              Total de cargos: {formatoBs(resultado.total_cargos)}
            </h4>

            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={() =>
                navigate('/dashboard/alquileres-activos')
              }
            >
              Volver al listado
            </button>
          </div>
        </div>
      ) : alquiler ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <strong>Cliente:</strong>{' '}
                #{alquiler.usuario_id}
              </div>

              <div className="col-md-6">
                <strong>Vehículo:</strong>{' '}
                #{alquiler.vehiculo_id}
              </div>

              <div className="col-md-6">
                <strong>Kilometraje inicial:</strong>{' '}
                {alquiler.kilometraje_inicial} km
              </div>

              <div className="col-md-6">
                <strong>Combustible inicial:</strong>{' '}
                {alquiler.combustible_inicial}%
              </div>
            </div>

            <form onSubmit={registrarDevolucion}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label
                    htmlFor="kilometraje_final"
                    className="form-label fw-semibold"
                  >
                    Kilometraje final
                  </label>

                  <input
                    id="kilometraje_final"
                    name="kilometraje_final"
                    type="number"
                    min={alquiler.kilometraje_inicial}
                    step="1"
                    className="form-control"
                    value={formulario.kilometraje_final}
                    onChange={cambiarCampo}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="combustible_final"
                    className="form-label fw-semibold"
                  >
                    Combustible final (%)
                  </label>

                  <input
                    id="combustible_final"
                    name="combustible_final"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="form-control"
                    value={formulario.combustible_final}
                    onChange={cambiarCampo}
                    required
                  />
                </div>

                <div className="col-12">
                  <div className="form-check">
                    <input
                      id="requiere_mantenimiento"
                      name="requiere_mantenimiento"
                      type="checkbox"
                      className="form-check-input"
                      checked={formulario.requiere_mantenimiento}
                      onChange={cambiarCampo}
                    />

                    <label
                      htmlFor="requiere_mantenimiento"
                      className="form-check-label"
                    >
                      El vehículo requiere mantenimiento
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label
                    htmlFor="observaciones_devolucion"
                    className="form-label fw-semibold"
                  >
                    Observaciones de devolución
                  </label>

                  <textarea
                    id="observaciones_devolucion"
                    name="observaciones_devolucion"
                    rows="4"
                    className="form-control"
                    value={formulario.observaciones_devolucion}
                    onChange={cambiarCampo}
                    placeholder="Describe el estado del vehículo al devolverlo..."
                    required
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Registrando...'
                    : 'Confirmar devolución'}
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
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default DevolucionPage;
