
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  listarPagos,
  registrarPago,
  consultarSaldo
} from '../../services/pagoService.js';

import { obtenerMensajeError } from '../../utils/manejarErrores';

import './GestionPagosPage.css';

const FORMULARIO_INICIAL = {
  reservaId: '',
  monto: '',
  metodoPago: 'EFECTIVO',
  referencia: ''
};

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

function GestionPagosPage() {

  const navigate = useNavigate();

  // ===================================
  // ESTADOS
  // ===================================

  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [mensaje, setMensaje] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [saldo, setSaldo] = useState(null);

  const [consultando, setConsultando] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  // ===================================
  // 1. CARGAR PAGOS
  // ===================================

  const cargarPagos = useCallback(async () => {

    setCargando(true);
    setError('');

    try {

      const respuesta = await listarPagos();

      setPagos(
        Array.isArray(respuesta?.pagos)
          ? respuesta.pagos
          : []
      );

    } catch (err) {

      setError(
        obtenerMensajeError(
          err,
          'No se pudieron cargar los pagos.'
        )
      );

    } finally {
      setCargando(false);
    }

  }, []);

  
    useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
        try {
        const respuesta = await listarPagos();

        if (!activo) return;

        setPagos(
            Array.isArray(respuesta?.pagos)
            ? respuesta.pagos
            : []
        );

        } catch (err) {
        if (!activo) return;

        setPagos([]);

        setError(
            obtenerMensajeError(
            err,
            'No se pudieron cargar los pagos.'
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
  // 2. INDICADORES
  // ===================================

  const pagosConfirmados = pagos.filter(
    pago => pago.estado === 'CONFIRMADO'
  );

  const totalRecaudado = pagosConfirmados.reduce(
    (total, pago) => total + Number(pago.monto || 0),
    0
  );

  // ===================================
  // 3. FILTRAR PAGOS
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
  // 4. CAMBIOS DEL FORMULARIO
  // ===================================

  const manejarCambio = (event) => {

    const { name, value } = event.target;

    setFormulario(anterior => ({
      ...anterior,
      [name]: value
    }));

    setErrorFormulario('');
    setMensaje('');

    if (name === 'reservaId') {
      setSaldo(null);
    }
  };

  // ===================================
  // 5. CONSULTAR SALDO
  // ===================================

  const manejarConsultarSaldo = async () => {

    setErrorFormulario('');
    setSaldo(null);

    const reservaId = Number(formulario.reservaId);

    if (
      !Number.isSafeInteger(reservaId) ||
      reservaId <= 0
    ) {
      setErrorFormulario(
        'Ingresa un ID de reserva válido.'
      );

      return;
    }

    setConsultando(true);

    try {

      const respuesta = await consultarSaldo(reservaId);

      setSaldo(respuesta);

    } catch (err) {

      setErrorFormulario(
        obtenerMensajeError(
          err,
          'No se pudo consultar el saldo de la reserva.'
        )
      );

    } finally {
      setConsultando(false);
    }
  };

  // ===================================
  // 6. REGISTRAR NUEVO PAGO
  // ===================================

  const manejarRegistrarPago = async (event) => {

    event.preventDefault();

    if (registrando) return;

    setErrorFormulario('');
    setMensaje('');

    const reservaId = Number(formulario.reservaId);
    const monto = Number(formulario.monto);

    if (
      !Number.isSafeInteger(reservaId) ||
      reservaId <= 0
    ) {
      setErrorFormulario(
        'Ingresa un ID de reserva válido.'
      );

      return;
    }

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      setErrorFormulario(
        'El monto debe ser mayor a cero.'
      );

      return;
    }

    if (
      !saldo ||
      Number(saldo.reservaId) !== reservaId
    ) {
      setErrorFormulario(
        'Debes consultar primero el saldo de la reserva.'
      );

      return;
    }

    if (monto > Number(saldo.saldoPendiente)) {

      setErrorFormulario(
        'El monto supera el saldo pendiente de la reserva.'
      );

      return;
    }

    setRegistrando(true);

    try {

      const respuesta = await registrarPago({
        reservaId,
        monto,
        metodoPago: formulario.metodoPago,
        referencia:
          formulario.referencia.trim() || null
      });

      setMensaje(
        respuesta.mensaje ||
        'Pago registrado correctamente.'
      );

      setFormulario({ ...FORMULARIO_INICIAL });
      setSaldo(null);

      await cargarPagos();

    } catch (err) {

      setErrorFormulario(
        obtenerMensajeError(
          err,
          'No se pudo registrar el pago.'
        )
      );

      // Obligar a consultar nuevamente el saldo
      setSaldo(null);

    } finally {
      setRegistrando(false);
    }
  };

  // ===================================
  // INTERFAZ
  // ===================================

  return (
    <main className="container py-4 pagos-page">

      {/* ENCABEZADO */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h2 className="fw-bold mb-1">
            Gestión de pagos
          </h2>

          <p className="text-secondary mb-0">
            Consulta y administra los pagos de las reservas.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={cargarPagos}
          disabled={cargando || registrando}
        >
          {cargando ? 'Actualizando...' : 'Actualizar lista'}
        </button>

      </div>

      {/* INDICADORES */}

      <div className="row g-3 mb-4">

        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <p className="text-secondary mb-1">
                Total recaudado
              </p>

              <h2 className="fw-bold text-success mb-0">
                {formatearMonto(totalRecaudado)}
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
                {pagos.length}
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
                {pagosConfirmados.length}
              </h2>

            </div>
          </div>
        </div>

      </div>

      {/* FORMULARIO DE PAGO */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">
          <h5 className="fw-semibold mb-0">
            Registrar nuevo pago
          </h5>
        </div>

        <div className="card-body">

          {mensaje && (
            <div className="alert alert-success" role="alert">
              {mensaje}
            </div>
          )}

          {errorFormulario && (
            <div className="alert alert-danger" role="alert">
              {errorFormulario}
            </div>
          )}

          <form onSubmit={manejarRegistrarPago}>

            <div className="row g-3">

              <div className="col-12 col-md-6">

                <label
                  htmlFor="reservaId"
                  className="form-label fw-semibold"
                >
                  ID de reserva
                </label>

                <div className="input-group">

                  <input
                    id="reservaId"
                    type="number"
                    className="form-control"
                    name="reservaId"
                    min="1"
                    step="1"
                    value={formulario.reservaId}
                    onChange={manejarCambio}
                    placeholder="Ej. 12"
                    disabled={consultando || registrando}
                    required
                  />

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={manejarConsultarSaldo}
                    disabled={consultando || registrando}
                  >
                    {consultando
                      ? 'Consultando...'
                      : 'Consultar saldo'}
                  </button>

                </div>
              </div>

              <div className="col-12 col-md-6">

                <label
                  htmlFor="metodoPago"
                  className="form-label fw-semibold"
                >
                  Método de pago
                </label>

                <select
                  id="metodoPago"
                  name="metodoPago"
                  className="form-select"
                  value={formulario.metodoPago}
                  onChange={manejarCambio}
                  disabled={registrando}
                >
                  <option value="EFECTIVO">
                    Efectivo
                  </option>

                  <option value="TRANSFERENCIA">
                    Transferencia bancaria
                  </option>

                  <option value="QR">
                    QR
                  </option>
                </select>

              </div>

              {/* INFORMACIÓN DEL SALDO */}

              {saldo && (
                <div className="col-12">

                  <div className="saldo-reserva p-3">

                    <div className="row g-3">

                      <div className="col-6 col-lg">

                        <small className="text-secondary">
                          Total base
                        </small>

                        <div className="fw-semibold">
                          {formatearMonto(saldo.totalBase)}
                        </div>

                      </div>

                      <div className="col-6 col-lg">

                        <small className="text-secondary">
                          Cargos adicionales
                        </small>

                        <div className="fw-semibold">
                          {formatearMonto(saldo.totalCargos)}
                        </div>

                      </div>

                      <div className="col-6 col-lg">

                        <small className="text-secondary">
                          Total final
                        </small>

                        <div className="fw-semibold">
                          {formatearMonto(saldo.totalFinal)}
                        </div>

                      </div>

                      <div className="col-6 col-lg">

                        <small className="text-secondary">
                          Total pagado
                        </small>

                        <div className="fw-semibold text-success">
                          {formatearMonto(saldo.totalPagado)}
                        </div>

                      </div>

                      <div className="col-12 col-lg">

                        <small className="text-secondary">
                          Saldo pendiente
                        </small>

                        <div className="fw-bold text-primary fs-5">
                          {formatearMonto(saldo.saldoPendiente)}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              <div className="col-12 col-md-6">

                <label
                  htmlFor="monto"
                  className="form-label fw-semibold"
                >
                  Monto (Bs)
                </label>

                <input
                  id="monto"
                  name="monto"
                  type="number"
                  className="form-control"
                  min="0.01"
                  step="0.01"
                  max={saldo
                    ? saldo.saldoPendiente
                    : undefined}
                  value={formulario.monto}
                  onChange={manejarCambio}
                  placeholder="0.00"
                  disabled={registrando}
                  required
                />

              </div>

              <div className="col-12 col-md-6">

                <label
                  htmlFor="referencia"
                  className="form-label fw-semibold"
                >
                  Referencia (opcional)
                </label>

                <input
                  id="referencia"
                  name="referencia"
                  type="text"
                  className="form-control"
                  maxLength="150"
                  value={formulario.referencia}
                  onChange={manejarCambio}
                  placeholder="Número de comprobante"
                  disabled={registrando}
                />

              </div>

              <div className="col-12">

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={
                    registrando ||
                    consultando ||
                    !saldo ||
                    Number(saldo.saldoPendiente) <= 0
                  }
                >
                  {registrando
                    ? 'Registrando pago...'
                    : 'Registrar pago'}
                </button>

              </div>

            </div>
          </form>
        </div>
      </div>

      {/* LISTADO DE PAGOS */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white py-3">

          <h5 className="fw-semibold mb-3">
            Listado de pagos
          </h5>

          <div className="row g-3">

            <div className="col-12 col-md-4">

              <input
                type="text"
                className="form-control"
                aria-label="Buscar por ID de reserva"
                placeholder="Buscar por ID de reserva..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />

            </div>

            <div className="col-12 col-md-4">

              <select
                className="form-select"
                aria-label="Filtrar método de pago"
                value={filtroMetodo}
                onChange={e => setFiltroMetodo(e.target.value)}
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
                onChange={e => setFiltroEstado(e.target.value)}
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

        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

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

            <p className="mt-3 text-secondary">
              Cargando pagos...
            </p>

          </div>

        ) : !error && pagosFiltrados.length === 0 ? (

          <div className="alert alert-info m-3">
            No se encontraron pagos.
          </div>

        ) : !error && (

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Reserva</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
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

                      <span className={`badge ${claseEstado(pago.estado)}`}>
                        {pago.estado}
                      </span>

                    </td>

                    <td>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate(
                            `/dashboard/pagos/reserva/${pago.reserva_id}`
                          )
                        }
                      >
                        Ver detalle
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
  );
}

export default GestionPagosPage;
