import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  // 1. Obtener el token del header "Authorization" (Bearer TOKEN)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    // 2. Verificar si el token es válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentacar_secret_dev_2025');
    
    // 3. Guardar los datos del usuario en la petición
    req.usuario = decoded;
    
    // 4. Pasar al siguiente controlador
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Permite acceder únicamente a usuarios con roles autorizados.
 * Debe utilizarse después de verifyToken.
 *
 * Ejemplo:
 * authorizeRoles('EMPLEADO', 'ADMINISTRADOR')
 */
export function authorizeRoles(...rolesPermitidos) {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Obtener el rol almacenado en el JWT
    const rol = req.usuario.rol;

    // Comprobar si el rol está autorizado
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
}
