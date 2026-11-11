// Error de negocio de las reservas.
// Lleva un código y el status HTTP que debe devolver la API, así el controlador
// no tiene que adivinar qué respuesta corresponde a cada fallo.
export class ReservaError extends Error {
  constructor(mensaje, codigo = 'ERROR', status = 400) {
    super(mensaje);
    this.name = 'ReservaError';
    this.codigo = codigo;
    this.status = status;
  }
}

export const errorValidacion = (mensaje) => new ReservaError(mensaje, 'VALIDACION', 400);
export const errorNoEncontrada = (mensaje = 'Reserva no encontrada') => new ReservaError(mensaje, 'NO_ENCONTRADA', 404);
export const errorConflicto = (mensaje) => new ReservaError(mensaje, 'CONFLICTO', 409);
export const errorTransicion = (mensaje) => new ReservaError(mensaje, 'TRANSICION_INVALIDA', 409);