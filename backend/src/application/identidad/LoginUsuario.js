import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UsuarioRepository from '../../infrastructure/repositories/UsuarioRepository.js';

export async function loginUsuario({ email, password }) {
  // 1. Buscar al usuario por email
  const usuario = await UsuarioRepository.findByEmail(email);
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  // 2. Verificar que el usuario esté activo
  if (!usuario.activo) {
    throw new Error('Usuario desactivado');
  }

  // 3. Comparar la contraseña enviada con la encriptada en la BD
  const passwordValido = await bcrypt.compare(password, usuario.password);
  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }

  // 4. Generar el Token JWT
  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET || 'rentacar_secret_dev_2025',
    { expiresIn: '24h' }
  );

  // 5. Retornar los datos y el token
  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    },
    token
  };
}