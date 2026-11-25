import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar/Navbar';

const TIPOS_PAGO = ['ANTICIPO', 'PAGO_PARCIAL', 'TOTAL'];
const METODOS_PAGO = ['EFECTIVO', 'QR', 'TRANSFERENCIA', 'TARJETA'];

function RegistrarPagoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alquiler, setAlquiler] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('PAGO_PARCIAL');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [fechaPago, setFechaPago] = useState(() => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  });

  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  const formatearMonto = (valor) => `Bs ${Number(valor ?? 0).toFixed(2)}`;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registrar';
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleString('es-BO');
  };

  const cargarDetalleAlquiler = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const resp = await api.get(`/alquileres/${id}`);
      const data = resp.data.alquiler || resp.data;
      setAlquiler(data);

      const saldo = Number(data.saldo_pendiente ?? 0);
      if (saldo > 0) {
        setMonto(saldo.toFixed(2));
        const yaHuboPagos = Array.isArray(data.pagos) && data.pagos.length > 0;
        setTipo(yaHuboPagos ? 'PAGO_PARCIAL' : 'TOTAL');
      } else {
        setMonto('');
      }
    } catch (err) {
      setErrorCarga(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        'No se pudo cargar la información del alquiler.'
      );
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDetalleAlquiler();
  }, [cargarDetalleAlquiler]);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setExitoMsg('');

    const montoNum = Number(monto);
    const saldoPendiente = Number(alquiler?.saldo_pendiente ?? 0);

    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setErrorForm('El monto del pago debe ser mayor a 0.');
      return;
    }

    if (montoNum > saldoPendiente + 0.0001) {
      setErrorForm(`El monto no puede exceder el saldo pendiente (${formatearMonto(saldoPendiente)}).`);
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        monto: montoNum,
        tipo,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago ? new Date(fechaPago).toISOString() : undefined
      };

      const resp = await api.post(`/alquileres/${id}/pagos`, payload);
      setExitoMsg(resp.data.mensaje || 'Pago registrado correctamente.');
      await cargarDetalleAlquiler();
    } catch (err) {
      setErrorForm(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        'No se pudo registrar el pago.'
      );
    } finally {
      setEnviando(false);
    }
  };

  const montoTotal = Number(alquiler?.monto_total ?? 0);
  const depositoGarantia = Number(alquiler?.deposito_garantia ?? 0);
  const totalPagado = Number(alquiler?.total_pagado ?? 0);
  const saldoPendiente = Number(alquiler?.saldo_pendiente ?? 0);
  const pagos = Array.isArray(alquiler?.pagos) ? alquiler.pagos : [];

  return (
    <div style={{ backgroundColor: 'var(--rc-bg)', minHeight: '100vh' }}>
      <Navbar />
      <main className="container py-4" style={{ marginTop: '80px' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--rc-text)' }}>
              Registrar pago — Alquiler #{id}
            </h2>
            <p className="text-secondary mb-0">
              Registra anticipos, pagos parciales o cancelación del saldo pendiente.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/dashboard/alquileres-activos" className="btn btn-outline-secondary">
              Alquileres activos
            </Link>
            <Link to="/dashboard/alquileres-historial" className="btn btn-outline-secondary">
              Historial
            </Link>
          </div>
        </div>

        {errorCarga && <div className="alert alert-danger">{errorCarga}</div>}

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-secondary">Cargando datos del alquiler...</p>
          </div>
        ) : alquiler && (
          <>
            {/* Resumen financiero */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <p className="text-secondary mb-1">Total final</p>
                    <h4 className="fw-bold mb-0">{formatearMonto(montoTotal)}</h4>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <p className="text-secondary mb-1">Depósito / Garantía</p>
                    <h4 className="fw-bold mb-0 text-info">{formatearMonto(depositoGarantia)}</h4>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <p className="text-secondary mb-1">Total pagado</p>
                    <h4 className="fw-bold mb-0 text-success">{formatearMonto(totalPagado)}</h4>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <p className="text-secondary mb-1">Saldo pendiente</p>
                    <h4 className={`fw-bold mb-0 ${saldoPendiente > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatearMonto(saldoPendiente)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* Formulario de pago */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-semibold">Nuevo pago</h5>
                  </div>
                  <div className="card-body">
                    {errorForm && <div className="alert alert-danger">{errorForm}</div>}
                    {exitoMsg && <div className="alert alert-success">{exitoMsg}</div>}

                    {saldoPendiente <= 0 ? (
                      <div className="alert alert-success mb-0">
                        Este alquiler no tiene saldo pendiente por pagar.
                      </div>
                    ) : (
                      <form onSubmit={manejarSubmit}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Monto (Bs)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={saldoPendiente}
                            className="form-control"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            required
                          />
                          <div className="form-text">
                            Máximo disponible: {formatearMonto(saldoPendiente)}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Tipo de pago</label>
                          <select
                            className="form-select"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                          >
                            {TIPOS_PAGO.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Método de pago</label>
                          <select
                            className="form-select"
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value)}
                          >
                            {METODOS_PAGO.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-semibold">Fecha de pago</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={fechaPago}
                            onChange={(e) => setFechaPago(e.target.value)}
                            required
                          />
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-success"
                            disabled={enviando}
                          >
                            {enviando ? 'Registrando...' : 'Registrar pago'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate(-1)}
                          >
                            Volver
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Historial de pagos del alquiler */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-semibold">Pagos registrados ({pagos.length})</h5>
                  </div>
                  <div className="card-body p-0">
                    {pagos.length === 0 ? (
                      <p className="text-secondary p-3 mb-0">Aún no se registraron pagos para este alquiler.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Fecha</th>
                              <th>Tipo</th>
                              <th>Método</th>
                              <th className="text-end">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagos.map((p) => (
                              <tr key={p.id}>
                                <td>{formatearFecha(p.fecha_pago)}</td>
                                <td><span className="badge bg-secondary">{p.tipo}</span></td>
                                <td>{p.metodo_pago}</td>
                                <td className="text-end fw-semibold text-success">
                                  {formatearMonto(p.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default RegistrarPagoPage;