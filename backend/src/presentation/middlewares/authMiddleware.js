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