import { calcularPrecio } from '../tarifas/TarifaService.js';
import { validarFechas } from '../disponibilidad/SolapamientoService.js';
import { errorValidacion, errorTransicion } from './ReservaError.js';

// ---------------------------------------------------------------------------
// Estados y máquina de estados (ver backend/reglas.md, sección 4)
//
//   RESERVADA -> CONFIRMADA -> ENTREGADA -> DEVUELTA -> FINALIZADA
//        \            \
//         +------------+--> CANCELADA   (solo desde RESERVADA o CONFIRMADA)
// ---------------------------------------------------------------------------
export const ESTADOS = Object.freeze({
  RESERVADA: 'RESERVADA',
  CONFIRMADA: 'CONFIRMADA',
  ENTREGADA: 'ENTREGADA',
  DEVUELTA: 'DEVUELTA',
  FINALIZADA: 'FINALIZADA',
  CANCELADA: 'CANCELADA'
});

// Mientras la reserva esté en alguno de estos estados, sus fechas quedan bloqueadas.
// ENTREGADA es el "EN_ALQUILER" de reglas.md: el auto está en la calle.
export const ESTADOS_BLOQUEANTES = Object.freeze([
  ESTADOS.RESERVADA,
  ESTADOS.CONFIRMADA,
  ESTADOS.ENTREGADA
]);

// Por ahora la API solo vende por hora o por día. TarifaService ya sabe
// calcular SEMANA y MES, pero falta definir de dónde sale su precio.
export const MODALIDADES_SOPORTADAS = Object.freeze(['HORA', 'DIA']);

const TRANSICIONES = Object.freeze({
  [ESTADOS.RESERVADA]: [ESTADOS.CONFIRMADA, ESTADOS.CANCELADA],
  [ESTADOS.CONFIRMADA]: [ESTADOS.ENTREGADA, ESTADOS.CANCELADA],
  [ESTADOS.ENTREGADA]: [ESTADOS.DEVUELTA],
  [ESTADOS.DEVUELTA]: [ESTADOS.FINALIZADA],
  [ESTADOS.FINALIZADA]: [],
  [ESTADOS.CANCELADA]: []
});

export function bloqueaDisponibilidad(estado) {
  return ESTADOS_BLOQUEANTES.includes(estado);
}

export function puedeTransicionar(desde, hacia) {
  return (TRANSICIONES[desde] ?? []).includes(hacia);
}

export function transicionar(estadoActual, estadoNuevo) {
  if (!(estadoActual in TRANSICIONES)) {
    throw errorValidacion(`Estado de reserva desconocido: ${estadoActual}`);
  }
  if (!(estadoNuevo in TRANSICIONES)) {
    throw errorValidacion(`Estado de reserva desconocido: ${estadoNuevo}`);
  }
  if (!puedeTransicionar(estadoActual, estadoNuevo)) {
    throw errorTransicion(`No se puede pasar una reserva de ${estadoActual} a ${estadoNuevo}`);
  }
  return estadoNuevo;
}

// Cancelar tiene su propio mensaje porque es la regla que más va a ver el usuario.
export function cancelar(estadoActual) {
  if (!puedeTransicionar(estadoActual, ESTADOS.CANCELADA)) {
    throw errorTransicion(
      `Solo se puede cancelar una reserva en estado RESERVADA o CONFIRMADA (estado actual: ${estadoActual})`
    );
  }
  return ESTADOS.CANCELADA;
}

// ---------------------------------------------------------------------------
// Validaciones y total
// ---------------------------------------------------------------------------

// Usa validarFechas (formato válido, fin > inicio, no en el pasado) pero
// devuelve un error de negocio con status 400 en lugar de un Error genérico.
export function validarIntervalo(fechaInicio, fechaFin) {
  try {
    validarFechas(fechaInicio, fechaFin);
  } catch (error) {
    throw errorValidacion(error.message);
  }
}

export function validarNuevaReserva({ fechaInicio, fechaFin, modalidad }) {
  if (!MODALIDADES_SOPORTADAS.includes(modalidad)) {
    throw errorValidacion(`Modalidad no válida. Usa: ${MODALIDADES_SOPORTADAS.join(' o ')}`);
  }
  validarIntervalo(fechaInicio, fechaFin);
}

// Cualquier fracción se cobra como unidad completa (4h15 por hora = 5 horas).
export function calcularTotalReserva({ fechaInicio, fechaFin, modalidad, precioUnitario }) {
  const horas = (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (60 * 60 * 1000);
  const total = calcularPrecio(horas, modalidad, precioUnitario);
  return { horas, total };
}
