
import api from './api.js';

// ===================================
// 1. HISTORIAL DEL CLIENTE AUTENTICADO
// ===================================

export async function listarMiHistorial() {
  const respuesta = await api.get('/historial/mio');
  return respuesta.data;
}

// ===================================
// 2. HISTORIAL GENERAL
// Administrador y Empleado
// ===================================

export async function listarHistorial() {
  const respuesta = await api.get('/historial');
  return respuesta.data;
}

// ===================================
// 3. HISTORIAL POR ENTIDAD
// ===================================

export async function listarHistorialPorEntidad(tipoEntidad, id) {
  const respuesta = await api.get(
    `/historial/${tipoEntidad}/${id}`
  );

  return respuesta.data;
}

// ===================================
// 4. HISTORIAL DE UN VEHÍCULO
// ===================================

export async function listarHistorialVehiculo(vehiculoId) {
  return await listarHistorialPorEntidad(
    'VEHICULO',
    vehiculoId
  );
}

// ===================================
// 5. HISTORIAL DE UNA RESERVA
// ===================================

export async function listarHistorialReserva(reservaId) {
  return await listarHistorialPorEntidad(
    'RESERVA',
    reservaId
  );
}

// ===================================
// 6. HISTORIAL DE UN ALQUILER
// ===================================

export async function listarHistorialAlquiler(alquilerId) {
  return await listarHistorialPorEntidad(
    'ALQUILER',
    alquilerId
  );
}
