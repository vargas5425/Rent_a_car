
import api from './api.js';

// ===================================
// 1. LISTAR TODOS LOS PAGOS
// Administrador y Empleado
// ===================================

export async function listarPagos() {
  const respuesta = await api.get('/pagos');
  return respuesta.data;
}

// ===================================
// 2. REGISTRAR UN NUEVO PAGO
// Administrador y Empleado
// ===================================

export async function registrarPago(datos) {
  const respuesta = await api.post('/pagos', datos);
  return respuesta.data;
}

// ===================================
// 3. CONSULTAR SALDO DE UNA RESERVA
// ===================================

export async function consultarSaldo(reservaId) {
  const respuesta = await api.get(
    `/pagos/reserva/${reservaId}/saldo`
  );

  return respuesta.data;
}

// ===================================
// 4. LISTAR PAGOS DE UNA RESERVA
// ===================================

export async function listarPagosPorReserva(reservaId) {
  const respuesta = await api.get(
    `/pagos/reserva/${reservaId}`
  );

  return respuesta.data;
}

// ===================================
// 5. CONSULTAR MIS PAGOS
// Cliente autenticado
// ===================================

export async function listarMisPagos() {
  const respuesta = await api.get('/pagos/mis-pagos');
  return respuesta.data;
}
