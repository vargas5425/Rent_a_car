export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Errores de dominio o con status HTTP explícito (ej. ReservaError: 400, 404, 409)
  if (err && typeof err.status === 'number') {
    return res.status(err.status).json({
      error: err.message,
      ...(err.codigo ? { codigo: err.codigo } : {})
    });
  }

  // Cuerpo de la petición demasiado grande (Express body-parser / express.json)
  if (err && (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError')) {
    return res.status(413).json({
      error: 'El tamaño de la petición excede el límite permitido'
    });
  }

  // JSON malformado en el body
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'El formato JSON enviado no es válido'
    });
  }

  // Restricción única en base de datos (Sequelize)
  if (err && err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos únicos'
    });
  }

  // Error de validación de modelo en Sequelize
  if (err && err.name === 'SequelizeValidationError') {
    const detalles = Array.isArray(err.errors)
      ? err.errors.map((e) => e.message)
      : [];
    return res.status(400).json({
      error: 'Error de validación en los datos',
      detalles
    });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({
    error: 'Error interno del servidor'
  });
}