
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  consultarSaldo,
  listarPagosPorReserva
} from '../../services/pagoService.js';

import { obtenerMensajeError } from '../../utils/manejarErrores';

import './GestionPagosPage.css';

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

function DetallePagosReservaPage() {

  const { reservaId } = useParams();
  const navigate = useNavigate();

  const [saldo, setSaldo] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ===================================
  // 1. CARGAR INFORMACIÓN INICIAL
  // ===================================

  useEffect(() => {

    let activo = true;

    const cargarInicial = async () => {

      try {

        const [datosSaldo, datosPagos] =
          await Promise.all([
            consultarSaldo(reservaId),
            listarPagosPorReserva(reservaId)
          ]);

        if (!activo) return;

        setSaldo(datosSaldo);

        setPagos(
          Array.isArray(datosPagos?.pagos)
            ? datosPagos.pagos
            : []
        );

      } catch (err) {

        if (!activo) return;

        setError(
          obtenerMensajeError(
            err,
            'No se pudo cargar el detalle de pagos.'
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

  }, [reservaId]);

  // ===================================
  // 2. ACTUALIZAR INFORMACIÓN
  // ===================================

  const actualizarDetalle = async () => {

    setCargando(true);
    setError('');

    try {

      const [datosSaldo, datosPagos] =
        await Promise.all([
          consultarSaldo(reservaId),
          listarPagosPorReserva(reservaId)
        ]);

      setSaldo(datosSaldo);

      setPagos(
        Array.isArray(datosPagos?.pagos)
          ? datosPagos.pagos
          : []
      );

    } catch (err) {

      setError(
        obtenerMensajeError(
          err,
          'No se pudo actualizar el detalle.'
        )
      );

    } finally {
      setCargando(false);
    }
  };

  // ===================================
  // 3. CALCULAR PORCENTAJE PAGADO
  // ===================================

  const totalFinal = Number(saldo?.totalFinal || 0);
  const totalPagado = Number(saldo?.totalPagado || 0);
  const saldoPendiente = Number(
    saldo?.saldoPendiente || 0
  );

  const porcentajePagado = totalFinal > 0
    ? Math.min(
        100,
        Math.max(0, (totalPagado / totalFinal) * 100)
      )
    : 0;

  const pagadoCompletamente =
    saldo !== null && saldoPendiente === 0;

  // ===================================
  // 4. INTERFAZ
  // ===================================

  return (
    <main className="container py-4 pagos-page">

      {/* NAVEGACIÓN */}

      <button
        type="button"
        className="btn btn-outline-secondary mb-4"
        onClick={() => navigate('/dashboard/pagos')}
      >
        ← Volver a Gestión de pagos
      </button>

      {/* ENCABEZADO */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>

          <h2 className="fw-bold mb-1">
            Detalle de pagos
          </h2>

          <p className="text-secondary mb-0">
            Información económica de la reserva #{reservaId}
          </p>

        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={actualizarDetalle}
          disabled={cargando}
        >
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>

      </div>

      {/* MENSAJE DE ERROR */}

      {error && (
        <div className="alert alert-danger" role="alert">
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
            Cargando información de la reserva...
          </p>

        </div>

      ) : !error && saldo && (

        <>

          {/* INDICADORES ECONÓMICOS */}

          <div className="row g-3 mb-4">

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">

                  <p className="text-secondary mb-1">
                    Total de la reserva
                  </p>

                  <h3 className="fw-bold mb-0">
                    {formatearMonto(saldo.totalBase)}
                  </h3>

                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">

                  <p className="text-secondary mb-1">
                    Cargos adicionales
                  </p>

                  <h3 className="fw-bold text-danger mb-0">
                    {formatearMonto(saldo.totalCargos)}
                  </h3>

                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">

                  <p className="text-secondary mb-1">
                    Total final
                  </p>

                  <h3 className="fw-bold mb-0">
                    {formatearMonto(totalFinal)}
                  </h3>

                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">

                  <p className="text-secondary mb-1">
                    Total pagado
                  </p>

                  <h3 className="fw-bold text-success mb-0">
                    {formatearMonto(totalPagado)}
                  </h3>

                </div>
              </div>
            </div>

          </div>

          {/* SALDO PENDIENTE */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">

                <div>

                  <p className="text-secondary mb-1">
                    Saldo pendiente
                  </p>

                  <h2 className={`fw-bold mb-0 ${
                    pagadoCompletamente
                      ? 'text-success'
                      : 'text-danger'
                  }`}>
                    {formatearMonto(saldoPendiente)}
                  </h2>

                </div>

                <span className={`badge ${
                  pagadoCompletamente
                    ? 'bg-success'
                    : saldoPendiente < 0
                      ? 'bg-danger'
                      : 'bg-warning text-dark'
                }`}>
                  {pagadoCompletamente
                    ? 'PAGADO COMPLETAMENTE'
                    : saldoPendiente < 0
                      ? 'REVISAR SALDO'
                      : 'PAGO PENDIENTE'}
                </span>

              </div>

              <div
                className="progress"
                style={{ height: '12px' }}
                role="progressbar"
                aria-label="Porcentaje pagado"
                aria-valuenow={porcentajePagado}
                aria-valuemin={0}
                aria-valuemax={100}
              >

                <div
                  className="progress-bar bg-success"
                  style={{
                    width: `${porcentajePagado}%`
                  }}
                />

              </div>

              <small className="text-secondary d-block mt-2">
                {porcentajePagado.toFixed(1)}% del total pagado
              </small>

            </div>

          </div>

          {/* HISTORIAL DE PAGOS */}

          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white py-3">

              <div className="d-flex justify-content-between align-items-center">

                <h5 className="fw-semibold mb-0">
                  Historial de pagos
                </h5>

                <span className="badge bg-primary">
                  {pagos.length} pagos
                </span>

              </div>

            </div>

            {pagos.length === 0 ? (

              <div className="alert alert-info m-3">
                Esta reserva todavía no tiene pagos registrados.
              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>
                      <th>ID</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th>Fecha de pago</th>
                      <th>Estado</th>
                    </tr>

                  </thead>

                  <tbody>

                    {pagos.map(pago => (

                      <tr key={pago.id}>

                        <td className="fw-semibold">
                          #{pago.id}
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

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </>

      )}

    </main>
  );
}

export default DetallePagosReservaPage;
