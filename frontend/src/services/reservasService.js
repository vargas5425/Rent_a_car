import api from './api';

// Todas las llamadas HTTP de reservas en un solo lugar, para que las páginas
// no tengan que conocer las URLs de la API.

export async function buscarDisponibles(fechaInicio, fechaFin) {
  const res = await api.get('/reservas/disponibilidad', { params: { fechaInicio, fechaFin } });
  return res.data;
}

export async function crearReserva({ vehiculoId, fechaInicio, fechaFin, modalidad }) {
  const res = await api.post('/reservas', { vehiculoId, fechaInicio, fechaFin, modalidad });
  return res.data.reserva;
}

export async function listarMisReservas() {
  const res = await api.get('/reservas/mias');
  return res.data;
}

export async function listarTodasLasReservas() {
  const res = await api.get('/reservas');
  return res.data;
}

export async function obtenerReserva(id) {
  const res = await api.get(`/reservas/${id}`);
  return res.data;
}

export async function confirmarReserva(id) {
  const res = await api.patch(`/reservas/${id}/confirmar`);
  return res.data.reserva;
}

export async function cancelarReserva(id) {
  const res = await api.patch(`/reservas/${id}/cancelar`);
  return res.data.reserva;
}

export async function crearAlquilerDesdeReserva(reservaId) {
  const respuesta = await api.post('/alquileres', {
    reservaId: Number(reservaId)
  });

  return respuesta.data.alquiler;
}
