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

// ... tu código de verifyToken ...

export function authorizeRole(rolesPermitidos) {
  return (req, res, next) => {
    // Asumimos que verifyToken ya se ejecutó y guardó el usuario en req.usuario
    if (!req.usuario || !req.usuario.rol) {
      return res.status(403).json({ error: 'Acceso denegado: No se encontró el rol del usuario' });
    }

    // Si el rol del usuario no está en la lista de permitidos, lo bloqueamos
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para esta acción' });
    }

    next();
  };
}