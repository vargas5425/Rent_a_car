import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

export default function EntregaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [kilometraje, setKilometraje] = useState('');
  const [combustible, setCombustible] = useState('');
  const [deposito, setDeposito] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [infoVehiculo, setInfoVehiculo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [entregaRegistrada, setEntregaRegistrada] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const cargarDatosVehiculo = async () => {
      setCargandoDatos(true);
      try {
        let alquiler = null;

        try {
          const respAlquiler = await api.get(`/alquileres/${id}`);
          alquiler = respAlquiler.data?.alquiler || respAlquiler.data || null;
        } catch {
          // Respaldo con /alquileres/pendientes si falla la consulta individual
        }

        if (!alquiler) {
          try {
            const respPendientes = await api.get('/alquileres/pendientes');
            const lista = Array.isArray(respPendientes.data?.alquileres)
              ? respPendientes.data.alquileres
              : [];
            alquiler = lista.find((a) => String(a.id) === String(id)) || null;
          } catch {
            // Sin respaldo disponible
          }
        }

        if (!isMounted || !alquiler) return;

        const vehiculo = alquiler.vehiculo || null;
        const kmActual = vehiculo?.kilometraje_actual;

        if (kmActual !== undefined && kmActual !== null && kmActual !== '') {
          setKilometraje((prev) => (prev === '' ? String(Number(kmActual)) : prev));
        }

        if (vehiculo?.marca || vehiculo?.modelo || vehiculo?.placa) {
          const nombre = `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim();
          setInfoVehiculo(vehiculo.placa ? `${nombre} (${vehiculo.placa})` : nombre);
        }
      } finally {
        if (isMounted) setCargandoDatos(false);
      }
    };

    cargarDatosVehiculo();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const volverAAlquileresPendientes = () => {
    navigate('/dashboard/alquileres-pendientes', {
      state: entregaRegistrada ? { entregaRegistradaId: id } : undefined
    });
  };

  const registrarEntrega = async (e) => {
    e.preventDefault();
    if (enviando || entregaRegistrada) return;
    setError('');

    const km = Number(kilometraje);
    const porcentaje = Number(combustible);
    const depositoNum = deposito.trim() === '' ? 0 : Number(deposito);

    if (kilometraje.trim() === '' || !Number.isInteger(km) || km < 0) {
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

    if (deposito.trim() !== '' && (!Number.isFinite(depositoNum) || depositoNum < 0)) {
      setError('El depósito/garantía debe ser un número positivo o cero.');
      return;
    }

    setEnviando(true);

    try {
      await api.patch(`/alquileres/${id}/entrega`, {
        kilometraje_inicial: km,
        combustible_inicial: porcentaje,
        deposito_garantia: depositoNum,
        observaciones_entrega: observaciones.trim()
      });

      setEntregaRegistrada(true);
      navigate('/dashboard/alquileres-pendientes', {
        state: { entregaRegistradaId: id }
      });
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
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container pb-5" style={{ maxWidth: '800px', paddingTop: '124px' }}>
        <div className="mb-3">
          <Link
            to="/dashboard/alquileres-pendientes"
            state={entregaRegistrada ? { entregaRegistradaId: id } : undefined}
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium"
            style={{
              color: 'var(--rc-text)',
              borderColor: 'var(--rc-border)',
              backgroundColor: 'var(--rc-card)'
            }}
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            <span>Volver a Alquileres Pendientes</span>
          </Link>
        </div>

        <h2 className="fw-bold mt-3" style={{ color: 'var(--rc-text)' }}>
          Registrar entrega del vehículo
        </h2>
        <p className="text-muted">
          Alquiler #{id}
          {infoVehiculo ? ` • ${infoVehiculo}` : ''}
          {usuario?.nombre ? ` • Responsable: ${usuario.nombre}` : ''}
        </p>

        <div
          className="card shadow-sm mt-4"
          style={{ backgroundColor: 'var(--rc-card)', borderColor: 'var(--rc-border)' }}
        >
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-semibold mb-0" style={{ color: 'var(--rc-text)' }}>
                Datos de entrega
              </h5>
              {cargandoDatos && (
                <small className="text-muted">Cargando datos del vehículo...</small>
              )}
            </div>

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
                  style={{ color: 'var(--rc-text)' }}
                >
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
                  disabled={enviando || entregaRegistrada}
                  required
                />
              </div>

              <div className="mb-3">
                <label
                  htmlFor="combustibleInicial"
                  className="form-label fw-semibold"
                  style={{ color: 'var(--rc-text)' }}
                >
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
                  disabled={enviando || entregaRegistrada}
                  required
                />
                <small className="text-muted">Ingresa un porcentaje entre 0 y 100.</small>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="depositoGarantia"
                  className="form-label fw-semibold"
                  style={{ color: 'var(--rc-text)' }}
                >
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
                  disabled={enviando || entregaRegistrada}
                />
                <small className="text-muted">Déjalo vacío si no se cobra garantía.</small>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="observacionesEntrega"
                  className="form-label fw-semibold"
                  style={{ color: 'var(--rc-text)' }}
                >
                  Observaciones del estado del vehículo al entregar
                </label>
                <textarea
                  id="observacionesEntrega"
                  rows="3"
                  className="form-control"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Rayones leves, llantas, accesorios incluidos, limpieza..."
                  disabled={enviando || entregaRegistrada}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className={`btn ${entregaRegistrada ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={enviando || entregaRegistrada}
                >
                  {entregaRegistrada
                    ? 'Entrega registrada'
                    : enviando
                    ? 'Registrando...'
                    : 'Registrar entrega'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={volverAAlquileresPendientes}
                  disabled={enviando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}