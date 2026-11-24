
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar/Navbar';

import { listarMisPagos } from '../../services/pagoService.js';

import { obtenerMensajeError } from '../../utils/manejarErrores';

import '../employee/GestionPagosPage.css';

const formatearMonto = (monto) => {
  return `Bs ${Number(monto || 0).toFixed(2)}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin registrar';

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? 'Fecha inválida'
    : valor.toLocaleString('es-BO');
};

const claseEstado = (estado) => {
  switch (estado) {
    case 'CONFIRMADO':
      return 'bg-success';

    case 'PENDIENTE':
      return 'bg-warning text-dark';

    case 'ANULADO':
      return 'bg-danger';

    default:
      return 'bg-secondary';
  }
};

function MisPagosPage() {

  const navigate = useNavigate();

  // ===================================
  // ESTADOS
  // ===================================

  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // ===================================
  // 1. CARGAR PAGOS INICIALMENTE
  // ===================================

  useEffect(() => {

    let activo = true;

    const cargarInicial = async () => {
      try {

        const respuesta = await listarMisPagos();

        if (!activo) return;

        setPagos(
          Array.isArray(respuesta?.pagos)
            ? respuesta.pagos
            : []
        );

      } catch (err) {

        if (!activo) return;

        setError(
          obtenerMensajeError(
            err,
            'No se pudieron cargar tus pagos.'
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
  // 2. ACTUALIZAR LISTA
  // ===================================

  const cargarPagos = async () => {

    setCargando(true);
    setError('');

    try {

      const respuesta = await listarMisPagos();

      setPagos(
        Array.isArray(respuesta?.pagos)
          ? respuesta.pagos
          : []
      );

    } catch (err) {

      setPagos([]);

      setError(
        obtenerMensajeError(
          err,
          'No se pudieron actualizar tus pagos.'
        )
      );

    } finally {
      setCargando(false);
    }
  };

  // ===================================
  // 3. INDICADORES
  // ===================================

  const pagosConfirmados = pagos.filter(
    pago => pago.estado === 'CONFIRMADO'
  );

  const totalPagado = pagosConfirmados.reduce(
    (total, pago) =>
      total + Number(pago.monto || 0),
    0
  );

  // ===================================
  // 4. FILTRAR PAGOS
  // ===================================

  const pagosFiltrados = pagos.filter(pago => {

    const coincideReserva =
      String(pago.reserva_id).includes(busqueda.trim());

    const coincideMetodo =
      !filtroMetodo ||
      pago.metodo_pago === filtroMetodo;

    const coincideEstado =
      !filtroEstado ||
      pago.estado === filtroEstado;

    return (
      coincideReserva &&
      coincideMetodo &&
      coincideEstado
    );
  });

  // ===================================
  // 5. INTERFAZ
  // ===================================

  return (
    <>

      <Navbar />

      <main className="container py-4 pagos-page">

        {/* ENCABEZADO */}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

          <div>

            <h2 className="fw-bold mb-1">
              Mis pagos
            </h2>

            <p className="text-secondary mb-0">
              Consulta el historial de tus pagos realizados.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={cargarPagos}
            disabled={cargando}
          >
            {cargando
              ? 'Actualizando...'
              : 'Actualizar lista'}
          </button>

        </div>

        {/* INDICADORES */}

        <div className="row g-3 mb-4">

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Total pagado
                </p>

                <h2 className="fw-bold text-success mb-0">
                  {error || cargando
                    ? '—'
                    : formatearMonto(totalPagado)}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Pagos registrados
                </p>

                <h2 className="fw-bold mb-0">
                  {error || cargando ? '—' : pagos.length}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-12 col-sm-6 col-lg-4">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <p className="text-secondary mb-1">
                  Pagos confirmados
                </p>

                <h2 className="fw-bold mb-0">
                  {error || cargando
                    ? '—'
                    : pagosConfirmados.length}
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* LISTADO DE PAGOS */}

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white py-3">

            <h5 className="fw-semibold mb-3">
              Historial de mis pagos
            </h5>

            {/* FILTROS */}

            <div className="row g-3">

              <div className="col-12 col-md-4">

                <input
                  type="text"
                  className="form-control"
                  aria-label="Buscar por reserva"
                  placeholder="Buscar por ID de reserva..."
                  value={busqueda}
                  onChange={e =>
                    setBusqueda(e.target.value)
                  }
                />

              </div>

              <div className="col-12 col-md-4">

                <select
                  className="form-select"
                  aria-label="Filtrar método de pago"
                  value={filtroMetodo}
                  onChange={e =>
                    setFiltroMetodo(e.target.value)
                  }
                >

                  <option value="">
                    Todos los métodos
                  </option>

                  <option value="EFECTIVO">
                    Efectivo
                  </option>

                  <option value="TRANSFERENCIA">
                    Transferencia
                  </option>

                  <option value="QR">
                    QR
                  </option>

                </select>

              </div>

              <div className="col-12 col-md-4">

                <select
                  className="form-select"
                  aria-label="Filtrar estado de pago"
                  value={filtroEstado}
                  onChange={e =>
                    setFiltroEstado(e.target.value)
                  }
                >

                  <option value="">
                    Todos los estados
                  </option>

                  <option value="CONFIRMADO">
                    Confirmado
                  </option>

                  <option value="PENDIENTE">
                    Pendiente
                  </option>

                  <option value="ANULADO">
                    Anulado
                  </option>

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

          {/* ESTADO DE CARGA */}

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
                Cargando tus pagos...
              </p>

            </div>

          ) : !error && pagosFiltrados.length === 0 ? (

            <div className="alert alert-info m-3">

              {pagos.length === 0
                ? 'Todavía no tienes pagos registrados.'
                : 'No se encontraron pagos con esos filtros.'}

            </div>

          ) : !error && (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">

                  <tr>
                    <th>ID</th>
                    <th>Reserva</th>
                    <th>Monto</th>
                    <th>Método de pago</th>
                    <th>Referencia</th>
                    <th>Fecha de pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>

                </thead>

                <tbody>

                  {pagosFiltrados.map(pago => (

                    <tr key={pago.id}>

                      <td className="fw-semibold">
                        #{pago.id}
                      </td>

                      <td>
                        #{pago.reserva_id}
                      </td>

                      <td className="fw-semibold">
                        {formatearMonto(pago.monto)}
                      </td>

                      <td>
                        {pago.metodo_pago}
                      </td>

                      <td>
                        {pago.referencia || 'Sin referencia'}
                      </td>

                      <td>
                        {formatearFecha(pago.fecha_pago)}
                      </td>

                      <td>

                        <span
                          className={`badge ${claseEstado(pago.estado)}`}
                        >
                          {pago.estado}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() =>
                            navigate(
                              `/reservas/${pago.reserva_id}`
                            )
                          }
                        >
                          Ver reserva
                        </button>

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

export default MisPagosPage;
