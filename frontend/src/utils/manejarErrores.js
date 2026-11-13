
export function obtenerMensajeError(error, mensajePorDefecto = 'Ocurrió un error inesperado.') {
  // Error de conexión: el servidor no respondió
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
  }

  const { status, data } = error.response;

  // Extraer el mensaje enviado por el backend
  const mensajeBackend =
    (typeof data?.error === 'string' && data.error.trim()) ||
    (typeof data?.mensaje === 'string' && data.mensaje.trim()) ||
    (typeof data?.message === 'string' && data.message.trim());

  // Sesión vencida o sin autorización
  if (status === 401) {
    return 'Tu sesión ha expirado o no tienes autorización. Inicia sesión nuevamente.';
  }

  // Conflictos: vehículo ocupado, reserva incompatible, etc.
  if (status === 409) {
    return mensajeBackend ||
      'No se puede completar la operación porque existe un conflicto. Actualiza la información e inténtalo nuevamente.';
  }

  // Errores de validación
  if (status === 400 || status === 422) {
    return mensajeBackend ||
      'Los datos ingresados no son válidos. Revisa la información.';
  }

  // Recurso inexistente
  if (status === 404) {
    return mensajeBackend || 'No se encontró la información solicitada.';
  }

  // Errores internos del servidor
  if (status >= 500) {
    return 'Ocurrió un problema en el servidor. Inténtalo nuevamente más tarde.';
  }

  return mensajeBackend || mensajePorDefecto;
}
