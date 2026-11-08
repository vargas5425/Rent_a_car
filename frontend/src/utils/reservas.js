// Utilidades de reservas para la interfaz.
// OJO: el total que se muestra aquí es solo una vista previa para el cliente.
// El que vale es el que calcula y guarda el backend (domain/reservas/Reserva.js).

export const ESTADOS_RESERVA = ['RESERVADA', 'CONFIRMADA', 'ENTREGADA', 'DEVUELTA', 'FINALIZADA'];

export const ETIQUETA_ESTADO = {
  RESERVADA: 'Reservada',
  CONFIRMADA: 'Confirmada',
  ENTREGADA: 'Entregada',
  DEVUELTA: 'Devuelta',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada'
};

export const CLASE_ESTADO = {
  RESERVADA: 'bg-warning text-dark',
  CONFIRMADA: 'bg-info text-dark',
  ENTREGADA: 'bg-primary',
  DEVUELTA: 'bg-secondary',
  FINALIZADA: 'bg-success',
  CANCELADA: 'bg-danger'
};

// Solo se puede cancelar en RESERVADA o CONFIRMADA (reglas.md, sección 4).
export function puedeCancelar(estado) {
  return estado === 'RESERVADA' || estado === 'CONFIRMADA';
}

export function formatearFecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatearBs(valor) {
  return `Bs ${Number(valor).toFixed(2)}`;
}

// Convierte una fecha a "YYYY-MM-DDTHH:mm" en hora local, el formato que usa <input type="datetime-local">.
export function aInputFecha(fecha) {
  const d = new Date(fecha);
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

// Cualquier fracción se cobra como unidad completa: 4h15 por hora = 5 horas; 1 día y 2 horas por día = 2 días.
export function calcularTotal({ fechaInicio, fechaFin, modalidad, precioUnitario }) {
  const inicio = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  const precio = Number(precioUnitario);

  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin <= inicio || !(precio > 0)) return null;

  const horas = (fin - inicio) / (60 * 60 * 1000);
  const unidades = modalidad === 'DIA' ? Math.ceil(horas / 24) : Math.ceil(horas);

  return { horas, unidades, total: unidades * precio };
}
