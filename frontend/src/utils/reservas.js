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

// Valida el formulario de búsqueda ANTES de llamar a la API.
// Devuelve el mensaje de error, o '' si las fechas están bien.
// Son las mismas reglas que aplica el backend (SolapamientoService.validarFechas): formato válido,
// inicio no en el pasado y fin posterior al inicio. Aquí solo se avisa antes, sin viajar al servidor;
// el backend sigue validando siempre.
export function validarBusqueda({ inicio, fin, ahora = new Date() }) {
  if (!inicio || !fin) return 'Elige la fecha de inicio y la de fin.';

  const desde = new Date(inicio).getTime();
  const hasta = new Date(fin).getTime();

  if (Number.isNaN(desde) || Number.isNaN(hasta)) return 'Una de las fechas no tiene un formato válido.';
  if (desde < ahora.getTime()) return 'La fecha de recogida no puede estar en el pasado.';
  if (hasta <= desde) return 'La fecha de devolución debe ser posterior a la de recogida.';

  return '';
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