export function authorizeRole(rolesPermitidos) {
  return (req, res, next) => {
    // req.usuario viene del verifyToken (contiene id y rol)
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos suficientes' });
    }

    next();
  };
}