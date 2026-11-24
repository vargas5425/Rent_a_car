
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar/Navbar.jsx';

import api from '../../services/api.js';

import {
  listarHistorialVehiculo
} from '../../services/historialService.js';

import {
  obtenerMensajeError
} from '../../utils/manejarErrores.js';

import './HistorialVehiculoPage.css';

// ===================================
// FUNCIONES AUXILIARES
// ===================================

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin registrar';

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? 'Fecha inválida'
    : valor.toLocaleString('es-BO');
};

const claseEstado = (estado) => {
  switch (estado) {
    case 'DISPONIBLE':
    case 'ACTIVO':
      return 'bg-success';

    case 'ALQUILADA':
      return 'bg-primary';

    case 'MANTENIMIENTO':
      return 'bg-warning text-dark';

    case 'INACTIVO':
      return 'bg-danger';

    default:
      return 'bg-secondary';
  }
};

function HistorialVehiculoPage() {

  const navigate = useNavigate();

  // ===================================
  // ESTADOS
  // ===================================

  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoId, setVehiculoId] = useState('');

  const [historial, setHistorial] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargandoVehiculos, setCargandoVehiculos] =
    useState(true);

  const [cargandoHistorial, setCargandoHistorial] =
    useState(false);

  const [error, setError] = useState('');
  const [errorHistorial, setErrorHistorial] = useState('');

  // ===================================
  // 1. CARGAR VEHÍCULOS
  // ===================================

  useEffect(() => {

    let activo = true;

    const cargarVehiculos = async () => {

      try {

        const respuesta = await api.get('/vehiculos');

        if (!activo) return;

        setVehiculos(
          Array.isArray(respuesta.data)
            ? respuesta.data
            : []
        );

      } catch (err) {

        if (!activo) return;

        setError(
          obtenerMensajeError(
            err,
            'No se pudieron cargar los vehículos.'
          )
        );

      } finally {

        if (activo) {
          setCargandoVehiculos(false);
        }
      }
    };

    cargarVehiculos();

    return () => {
      activo = false;
    };

  }, []);

  // ===================================
  // 2. CONSULTAR HISTORIAL
  // ===================================

  const consultarHistorial = async () => {

    const id = Number(vehiculoId);

    if (!Number.isSafeInteger(id) || id <= 0) {

      setErrorHistorial(
        'Selecciona o ingresa un ID de vehículo válido.'
      );

      return;
    }

    setCargandoHistorial(true);
    setErrorHistorial('');
    setHistorial([]);
    setFiltroEstado('');

    try {

      const respuesta =
        await listarHistorialVehiculo(id);

      setHistorial(
        Array.isArray(respuesta?.historial)
          ? respuesta.historial
          : []
      );

    } catch (err) {

      setErrorHistorial(
        obtenerMensajeError(
          err,
          'No se pudo consultar el historial del vehículo.'
        )
      );

    } finally {
      setCargandoHistorial(false);
    }
  };

  // ===================================
  // 3. FILTRAR VEHÍCULOS
  // ===================================

  const vehiculosFiltrados = vehiculos.filter(
    vehiculo => {

      const texto = [
        vehiculo.placa,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.anio
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(
        busqueda.trim().toLowerCase()
      );
    }
  );

  const vehiculoSeleccionado = vehiculos.find(
    vehiculo =>
      Number(vehiculo.id) === Number(vehiculoId)
  );

  // ===================================
  // 4. FILTRAR HISTORIAL
  // ===================================

  const estadosDisponibles = [
    ...new Set(
      historial
        .map(registro => registro.estado_nuevo)
        .filter(Boolean)
    )
  ].sort();

  const historialFiltrado = historial.filter(
    registro =>
      !filtroEstado ||
      registro.estado_nuevo === filtroEstado
  );

  // ===================================
  // 5. CAMBIAR VEHÍCULO
  // ===================================

  const manejarCambioVehiculo = (valor) => {

    setVehiculoId(valor);
    setHistorial([]);
    setErrorHistorial('');
    setFiltroEstado('');
  };

  // ===================================
  // 6. INTERFAZ
  // ===================================

  return (
    <>

      <Navbar />

      <main className="container py-4 historial-vehiculo-page">

        {/* BOTÓN VOLVER */}

        <button
          type="button"
          className="btn btn-outline-secondary mb-4"
          onClick={() => navigate('/dashboard')}
        >
          ← Volver al Dashboard
        </button>

        {/* ENCABEZADO */}

        <div className="mb-4">

          <h2 className="fw-bold mb-1">
            Historial de vehículos
          </h2>

          <p className="text-secondary mb-0">
            Consulta los cambios de estado y movimientos
            administrativos de los vehículos.
          </p>

        </div>

        {/* ERROR GENERAL */}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* SELECCIÓN DE VEHÍCULO */}

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-header py-3">

            <h5 className="fw-semibold mb-0">
              Seleccionar vehículo
            </h5>

          </div>

          <div className="card-body">

            <div className="row g-3">

              <div className="col-12 col-md-6">

                <label
                  htmlFor="buscarVehiculo"
                  className="form-label fw-semibold"
                >
                  Buscar vehículo
                </label>

                <input
                  id="buscarVehiculo"
                  type="text"
                  className="form-control"
                  placeholder="Placa, marca o modelo..."
                  value={busqueda}
                  onChange={e =>
                    setBusqueda(e.target.value)
                  }
                  disabled={cargandoVehiculos}
                />

              </div>

              <div className="col-12 col-md-6">

                <label
                  htmlFor="vehiculoId"
                  className="form-label fw-semibold"
                >
                  Vehículo
                </label>

                <select
                  id="vehiculoId"
                  className="form-select"
                  value={
                    vehiculosFiltrados.some(
                      v => String(v.id) === vehiculoId
                    )
                      ? vehiculoId
                      : ''
                  }
                  onChange={e =>
                    manejarCambioVehiculo(e.target.value)
                  }
                  disabled={
                    cargandoVehiculos ||
                    cargandoHistorial
                  }
                >

                  <option value="">

                    {cargandoVehiculos
                      ? 'Cargando vehículos...'
                      : 'Seleccionar vehículo'}

                  </option>

                  {vehiculosFiltrados.map(vehiculo => (

                    <option
                      key={vehiculo.id}
                      value={vehiculo.id}
                    >

                      #{vehiculo.id} -
                      {' '}{vehiculo.marca}
                      {' '}{vehiculo.modelo}
                      {' - '}{vehiculo.placa}

                    </option>

                  ))}

                </select>

              </div>

              {/* CONSULTAR POR ID */}

              <div className="col-12 col-md-6">

                <label
                  htmlFor="idManual"
                  className="form-label fw-semibold"
                >
                  ID del vehículo
                </label>

                <input
                  id="idManual"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  value={vehiculoId}
                  onChange={e =>
                    manejarCambioVehiculo(e.target.value)
                  }
                  placeholder="Ej. 5"
                  disabled={cargandoHistorial}
                />

                <small className="text-secondary">
                  También permite consultar vehículos
                  dados de baja mediante su ID.
                </small>

              </div>

              <div className="col-12 col-md-6 d-flex align-items-end">

                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={consultarHistorial}
                  disabled={
                    cargandoHistorial ||
                    !vehiculoId
                  }
                >

                  {cargandoHistorial
                    ? 'Consultando...'
                    : 'Consultar historial'}

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* INDICADORES */}

        <div className="row g-3 mb-4">

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Vehículo seleccionado
                </p>

                <h5 className="fw-bold mb-0">

                  {vehiculoSeleccionado
                    ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
                    : vehiculoId
                      ? `Vehículo #${vehiculoId}`
                      : 'Sin seleccionar'}

                </h5>

                {vehiculoSeleccionado && (

                  <small className="text-secondary">

                    Placa: {vehiculoSeleccionado.placa}

                  </small>

                )}

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-2">
                  Estado físico actual
                </p>

                {vehiculoSeleccionado ? (

                  <span
                    className={`badge ${claseEstado(
                      vehiculoSeleccionado.estado
                    )}`}
                  >

                    {vehiculoSeleccionado.estado}

                  </span>

                ) : (

                  <span className="text-secondary">
                    No disponible
                  </span>

                )}

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Total de movimientos
                </p>

                <h2 className="fw-bold mb-0">

                  {cargandoHistorial || errorHistorial
                    ? '—'
                    : historial.length}

                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* HISTORIAL DE CAMBIOS */}

        <div className="card border-0 shadow-sm">

          <div className="card-header py-3">

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

              <h5 className="fw-semibold mb-0">
                Historial de cambios
              </h5>

              <select
                className="form-select filtro-historial"
                aria-label="Filtrar por estado"
                value={filtroEstado}
                onChange={e =>
                  setFiltroEstado(e.target.value)
                }
              >

                <option value="">
                  Todos los estados
                </option>

                {estadosDisponibles.map(estado => (

                  <option
                    key={estado}
                    value={estado}
                  >

                    {estado}

                  </option>

                ))}

              </select>

            </div>

          </div>

          {/* ERROR DE HISTORIAL */}

          {errorHistorial && (

            <div
              className="alert alert-danger m-3"
              role="alert"
            >

              {errorHistorial}

            </div>

          )}

          {/* CARGANDO */}

          {cargandoHistorial ? (

            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
              >

                <span className="visually-hidden">
                  Cargando...
                </span>

              </div>

              <p className="text-secondary mt-3">
                Consultando historial...
              </p>

            </div>

          ) : !errorHistorial &&
              historialFiltrado.length === 0 ? (

            <div className="alert alert-info m-3">

              {!vehiculoId
                ? 'Selecciona un vehículo para consultar su historial.'
                : historial.length === 0
                  ? 'Consulta el historial. Si no aparecen movimientos, el vehículo todavía no tiene registros de auditoría.'
                  : 'No se encontraron movimientos con ese filtro.'}

            </div>

          ) : !errorHistorial && (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">

                  <tr>
                    <th>ID</th>
                    <th>Estado anterior</th>
                    <th>Estado nuevo</th>
                    <th>Responsable</th>
                    <th>Observación</th>
                    <th>Fecha y hora</th>
                  </tr>

                </thead>

                <tbody>

                  {historialFiltrado.map(registro => (

                    <tr key={registro.id}>

                      <td className="fw-semibold">

                        #{registro.id}

                      </td>

                      <td>

                        <span
                          className={`badge ${claseEstado(
                            registro.estado_anterior
                          )}`}
                        >

                          {registro.estado_anterior ||
                            'CREACIÓN'}

                        </span>

                      </td>

                      <td>

                        <span
                          className={`badge ${claseEstado(
                            registro.estado_nuevo
                          )}`}
                        >

                          {registro.estado_nuevo}

                        </span>

                      </td>

                      <td>

                        {registro.usuario_id
                          ? `Usuario #${registro.usuario_id}`
                          : 'Sin identificar'}

                      </td>

                      <td className="observacion-historial">

                        {registro.observacion ||
                          'Sin observación'}

                      </td>

                      <td>

                        {formatearFecha(
                          registro.fecha_cambio
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </>
  );
}

export default HistorialVehiculoPage;
