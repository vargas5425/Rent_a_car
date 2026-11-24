import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import './DevolucionPage.css';

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

  // 👇 NUEVO: Estado para los cargos manuales
  const [cargosManuales, setCargosManuales] = useState([]);
  const [nuevoCargo, setNuevoCargo] = useState({ tipo: 'DANIO', descripcion: '', monto: '' });

  useEffect(() => {
    let activo = true;

    async function cargarAlquiler() {
      try {
        const respuesta = await api.get(`/alquileres/${id}`);
        const encontrado = respuesta.data.alquiler;

        if (encontrado.estado !== 'ACTIVO') {
          throw new Error('Este alquiler no está activo actualmente.');
        }

        if (activo) {
          setAlquiler(encontrado);
          setFormulario((anterior) => ({
            ...anterior,
            kilometraje_final: String(encontrado.kilometraje_inicial ?? ''),
            combustible_final: String(encontrado.combustible_inicial ?? '')
          }));
        }
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.error || 
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
    return () => { activo = false; };
  }, [id]);

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const agregarCargo = () => {
    if (!nuevoCargo.descripcion.trim() || !nuevoCargo.monto) return;
    const montoNum = Number(nuevoCargo.monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    setCargosManuales([...cargosManuales, { ...nuevoCargo, monto: montoNum }]);
    setNuevoCargo({ tipo: 'DANIO', descripcion: '', monto: '' }); // Limpiar
  };

  const eliminarCargo = (index) => {
    setCargosManuales(cargosManuales.filter((_, i) => i !== index));
  };

  const registrarDevolucion = async (event) => {
    event.preventDefault();
    setError('');

    const kilometraje = Number(formulario.kilometraje_final);
    const combustible = Number(formulario.combustible_final);

    if (formulario.kilometraje_final === '' || !Number.isInteger(kilometraje) || kilometraje < Number(alquiler.kilometraje_inicial)) {
      setError('El kilometraje final debe ser igual o mayor al inicial.');
      return;
    }

    if (formulario.combustible_final === '' || !Number.isInteger(combustible) || combustible < 0 || combustible > 100) {
      setError('El combustible debe estar entre 0 y 100.');
      return;
    }

    if (!formulario.observaciones_devolucion.trim()) {
      setError('Debes ingresar las observaciones de devolución.');
      return;
    }

    try {
      setGuardando(true);
      const respuesta = await api.patch(`/alquileres/${id}/devolucion`, {
        kilometraje_final: kilometraje,
        combustible_final: combustible,
        requiere_mantenimiento: formulario.requiere_mantenimiento,
        observaciones_devolucion: formulario.observaciones_devolucion.trim(),
        cargos_manuales: cargosManuales // 👈 Enviamos los cargos manuales al backend
      });

      setResultado(respuesta.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        'No se pudo registrar la devolución.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatoBs = (valor) => `Bs ${Number(valor || 0).toFixed(2)}`;

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
        onClick={() => navigate('/dashboard/alquileres-activos')}
      >
        Volver a alquileres activos
      </button>

      <h2 className="fw-bold mb-2">Registrar devolución</h2>
      <p className="text-secondary mb-4">Alquiler #{id}</p>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {resultado ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="alert alert-success">
              {resultado.mensaje || 'Devolución registrada correctamente.'}
            </div>

            <h5 className="fw-bold mb-3">Resumen de devolución</h5>
            <p><strong>Estado del vehículo:</strong> {resultado.vehiculo?.estado}</p>
            <p><strong>Horas de retraso:</strong> {resultado.retraso?.horas_retraso ?? 0} (Cargo: {formatoBs(resultado.retraso?.monto)})</p>
            <p><strong>Combustible faltante:</strong> {resultado.combustible?.combustible_faltante ?? 0}% (Cargo: {formatoBs(resultado.combustible?.monto)})</p>
            
            {resultado.cargos_generados?.filter(c => !['RETRASO', 'COMBUSTIBLE'].includes(c.tipo)).length > 0 && (
              <div className="mt-3">
                <strong>Cargos manuales registrados:</strong>
                <ul>
                  {resultado.cargos_generados.filter(c => !['RETRASO', 'COMBUSTIBLE'].includes(c.tipo)).map(c => (
                    <li key={c.id}>{c.descripcion}: {formatoBs(c.monto)}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <hr />
            <div className="d-flex flex-column bg-light p-3 rounded">
              <div className="d-flex justify-content-between mb-2">
                <span><strong>Monto base del alquiler:</strong></span>
                <span>{formatoBs(resultado.monto_base)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span><strong>Total de cargos:</strong></span>
                <span>{formatoBs(resultado.total_cargos)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span><strong>Depósito / Garantía (a favor):</strong></span>
                <span className="text-danger">-{formatoBs(resultado.deposito_garantia)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between text-success">
                <h5 className="fw-bold mb-0">Saldo Final a Pagar:</h5>
                <h5 className="fw-bold mb-0">{formatoBs(resultado.saldo_a_pagar)}</h5>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => navigate('/dashboard/alquileres-activos')}
            >
              Volver al listado
            </button>
          </div>
        </div>
      ) : alquiler ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="row g-3 mb-4">
              <div className="col-md-6"><strong>Cliente:</strong> {alquiler.usuario ? `${alquiler.usuario.nombre}` : `#${alquiler.usuario_id}`}</div>
              <div className="col-md-6"><strong>Vehículo:</strong> {alquiler.vehiculo ? `${alquiler.vehiculo.marca} ${alquiler.vehiculo.modelo} - ${alquiler.vehiculo.placa}` : `#${alquiler.vehiculo_id}`}</div>
              <div className="col-md-6"><strong>Kilometraje inicial:</strong> {alquiler.kilometraje_inicial} km</div>
              <div className="col-md-6"><strong>Combustible inicial:</strong> {alquiler.combustible_inicial}%</div>
              <div className="col-md-6"><strong>Depósito en garantía:</strong> {formatoBs(alquiler.deposito_garantia)}</div>
            </div>

            <form onSubmit={registrarDevolucion}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Kilometraje final</label>
                  <input
                    name="kilometraje_final"
                    type="number"
                    min={alquiler.kilometraje_inicial}
                    className="form-control"
                    value={formulario.kilometraje_final}
                    onChange={cambiarCampo}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Combustible final (%)</label>
                  <input
                    name="combustible_final"
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formulario.combustible_final}
                    onChange={cambiarCampo}
                    required
                  />
                </div>

                <div className="col-12">
                  <div className="form-check">
                    <input
                      name="requiere_mantenimiento"
                      type="checkbox"
                      className="form-check-input"
                      checked={formulario.requiere_mantenimiento}
                      onChange={cambiarCampo}
                    />
                    <label className="form-check-label">El vehículo requiere mantenimiento</label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Observaciones de devolución</label>
                  <textarea
                    name="observaciones_devolucion"
                    rows="2"
                    className="form-control"
                    value={formulario.observaciones_devolucion}
                    onChange={cambiarCampo}
                    placeholder="Describe el estado del vehículo..."
                    required
                  />
                </div>

                {/* 👇 NUEVA SECCIÓN: Cargos Manuales / Daños */}
                <div className="col-12 mt-4">
                  <h5 className="fw-bold border-bottom pb-2">Registrar Daños o Cargos Extras</h5>
                  <p className="text-muted small">Si el vehículo presenta daños o requiere limpieza, agrégalos aquí para que se sumen al total.</p>
                  
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-3">
                      <label className="form-label small">Tipo</label>
                      <select className="form-select" value={nuevoCargo.tipo} onChange={(e) => setNuevoCargo({...nuevoCargo, tipo: e.target.value})}>
                        <option value="DANIO">Daño</option>
                        <option value="LIMPIEZA">Limpieza</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small">Descripción</label>
                      <input type="text" className="form-control" placeholder="Ej. Rayón en puerta" value={nuevoCargo.descripcion} onChange={(e) => setNuevoCargo({...nuevoCargo, descripcion: e.target.value})} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Monto (Bs)</label>
                      <input type="number" className="form-control" placeholder="0.00" value={nuevoCargo.monto} onChange={(e) => setNuevoCargo({...nuevoCargo, monto: e.target.value})} />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-outline-primary w-100" onClick={agregarCargo}>Agregar</button>
                    </div>
                  </div>

                  {cargosManuales.length > 0 && (
                    <ul className="list-group mb-3">
                      {cargosManuales.map((c, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-secondary me-2">{c.tipo}</span>
                            {c.descripcion}
                          </div>
                          <div>
                            <strong className="me-3">{formatoBs(c.monto)}</strong>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarCargo(index)}>X</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2 mt-4 pt-3 border-top">
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Registrando...' : 'Confirmar devolución y calcular total'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/dashboard/alquileres-activos')}
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