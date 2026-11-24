
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar/Navbar';

import {
  listarMiHistorial
} from '../../services/historialService.js';

import {
  obtenerMensajeError
} from '../../utils/manejarErrores';

import './MiHistorialPage.css';

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

    case 'FINALIZADA':
    case 'FINALIZADO':
    case 'ACTIVO':
    case 'DISPONIBLE':
      return 'bg-success';

    case 'CANCELADA':
    case 'CANCELADO':
      return 'bg-danger';

    case 'RESERVADA':
    case 'PENDIENTE':
      return 'bg-warning text-dark';

    case 'CONFIRMADA':
    case 'ENTREGADA':
    case 'DEVUELTA':
      return 'bg-primary';

    default:
      return 'bg-secondary';
  }
};

const describirEstado = (estado) => {
  const descripciones = {
    RESERVADA: 'Tu reserva fue registrada.',
    CONFIRMADA: 'Tu reserva fue confirmada.',
    ENTREGADA: 'El vehículo fue entregado.',
    DEVUELTA: 'La devolución del vehículo fue registrada.',
    FINALIZADA: 'La reserva fue finalizada.',
    CANCELADA: 'La reserva fue cancelada.',
    PENDIENTE: 'El alquiler está pendiente de entrega.',
    ACTIVO: 'El alquiler se encuentra activo.',
    FINALIZADO: 'El alquiler fue finalizado.',
    CANCELADO: 'El alquiler fue cancelado.'
  };

  return descripciones[estado] ||
    'Se registró un cambio de estado.';
};

function MiHistorialPage() {

  const navigate = useNavigate();

  // ===================================
  // ESTADOS
  // ===================================

  const [historial, setHistorial] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');

  const [filtroTipo, setFiltroTipo] = useState('');

  const [filtroEstado, setFiltroEstado] = useState('');

  // ===================================
  // 1. CARGAR HISTORIAL INICIAL
  // ===================================

  useEffect(() => {

    let activo = true;

    const cargarInicial = async () => {

      try {

        const respuesta = await listarMiHistorial();

        if (!activo) return;

        setHistorial(
          Array.isArray(respuesta?.historial)
            ? respuesta.historial
            : []
        );

      } catch (err) {

        if (!activo) return;

        setError(
          obtenerMensajeError(
            err,
            'No se pudo cargar tu historial.'
          )
        );

      } finally {

        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarInicial();

    return () => {
      activo = false;
    };

  }, []);

  // ===================================
  // 2. ACTUALIZAR HISTORIAL
  // ===================================

  const cargarHistorial = async () => {

    setCargando(true);
    setError('');

    try {

      const respuesta = await listarMiHistorial();

      setHistorial(
        Array.isArray(respuesta?.historial)
          ? respuesta.historial
          : []
      );

    } catch (err) {

      setHistorial([]);

      setError(
        obtenerMensajeError(
          err,
          'No se pudo actualizar tu historial.'
        )
      );

    } finally {
      setCargando(false);
    }
  };

  // ===================================
  // 3. INDICADORES
  // ===================================

  const movimientosReservas = historial.filter(
    registro => registro.tipo_entidad === 'RESERVA'
  ).length;

  const movimientosAlquileres = historial.filter(
    registro => registro.tipo_entidad === 'ALQUILER'
  ).length;

  // Estados disponibles para el filtro
  const estadosDisponibles = [
    ...new Set(
      historial
        .map(registro => registro.estado_nuevo)
        .filter(Boolean)
    )
  ].sort();

  // ===================================
  // 4. FILTRAR HISTORIAL
  // ===================================

  const historialFiltrado = historial.filter(registro => {

    const coincideBusqueda =
      String(registro.entidad_id).includes(
        busqueda.trim()
      );

    const coincideTipo =
      !filtroTipo ||
      registro.tipo_entidad === filtroTipo;

    const coincideEstado =
      !filtroEstado ||
      registro.estado_nuevo === filtroEstado;

    return (
      coincideBusqueda &&
      coincideTipo &&
      coincideEstado
    );
  });

  // ===================================
  // 5. INTERFAZ
  // ===================================

  return (
    <>

      <Navbar />

      <main className="container py-4 mi-historial-page">

        {/* ENCABEZADO */}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

          <div>

            <h2 className="fw-bold mb-1">
              Mi historial
            </h2>

            <p className="text-secondary mb-0">
              Consulta los movimientos de tus reservas y alquileres.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={cargarHistorial}
            disabled={cargando}
          >
            {cargando
              ? 'Actualizando...'
              : 'Actualizar historial'}
          </button>

        </div>

        {/* INDICADORES */}

        <div className="row g-3 mb-4">

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Total de movimientos
                </p>

                <h2 className="fw-bold mb-0">
                  {error || cargando
                    ? '—'
                    : historial.length}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Movimientos de reservas
                </p>

                <h2 className="fw-bold text-primary mb-0">
                  {error || cargando
                    ? '—'
                    : movimientosReservas}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Movimientos de alquileres
                </p>

                <h2 className="fw-bold text-success mb-0">
                  {error || cargando
                    ? '—'
                    : movimientosAlquileres}
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* HISTORIAL */}

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white py-3">

            <h5 className="fw-semibold mb-3">
              Historial de movimientos
            </h5>

            {/* FILTROS */}

            <div className="row g-3">

              <div className="col-12 col-md-4">

                <input
                  type="text"
                  className="form-control"
                  aria-label="Buscar por identificador"
                  placeholder="Buscar por ID..."
                  value={busqueda}
                  onChange={e =>
                    setBusqueda(e.target.value)
                  }
                />

              </div>

              <div className="col-12 col-md-4">

                <select
                  className="form-select"
                  aria-label="Filtrar tipo de movimiento"
                  value={filtroTipo}
                  onChange={e =>
                    setFiltroTipo(e.target.value)
                  }
                >

                  <option value="">
                    Todos los movimientos
                  </option>

                  <option value="RESERVA">
                    Reservas
                  </option>

                  <option value="ALQUILER">
                    Alquileres
                  </option>

                </select>

              </div>

              <div className="col-12 col-md-4">

                <select
                  className="form-select"
                  aria-label="Filtrar estado"
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

          </div>

          {/* MENSAJE DE ERROR */}

          {error && (
            <div
              className="alert alert-danger m-3"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* CARGANDO */}

          {cargando ? (

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
                Cargando tu historial...
              </p>

            </div>

          ) : !error && historialFiltrado.length === 0 ? (

            <div className="alert alert-info m-3">

              {historial.length === 0
                ? 'Todavía no tienes movimientos registrados.'
                : 'No se encontraron movimientos con esos filtros.'}

            </div>

          ) : !error && (

            <div className="card-body">

              <div className="historial-timeline">

                {historialFiltrado.map(registro => (

                  <article
                    key={registro.id}
                    className="historial-item"
                  >

                    <span
                      className="historial-punto"
                      aria-hidden="true"
                    />

                    <div className="historial-contenido">

                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

                        <h6 className="fw-bold mb-0">

                          {registro.tipo_entidad === 'RESERVA'
                            ? 'Reserva'
                            : 'Alquiler'}

                          {' #'}{registro.entidad_id}

                        </h6>

                        <small className="text-secondary">
                          {formatearFecha(
                            registro.fecha_cambio
                          )}
                        </small>

                      </div>

                      {/* TRANSICIÓN DE ESTADO */}

                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">

                        <span className="badge bg-secondary">

                          {registro.estado_anterior ||
                            'CREACIÓN'}

                        </span>

                        <span className="text-secondary">
                          →
                        </span>

                        <span
                          className={`badge ${claseEstado(registro.estado_nuevo)}`}
                        >

                          {registro.estado_nuevo}

                        </span>

                      </div>

                      <p className="text-secondary mb-2">

                        {describirEstado(
                          registro.estado_nuevo
                        )}

                      </p>

                      {registro.tipo_entidad === 'RESERVA' && (

                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() =>
                            navigate(
                              `/reservas/${registro.entidad_id}`
                            )
                          }
                        >
                          Ver reserva
                        </button>

                      )}

                    </div>

                  </article>

                ))}

              </div>

            </div>

          )}

        </div>

      </main>

    </>
  );
}

export default MiHistorialPage;
