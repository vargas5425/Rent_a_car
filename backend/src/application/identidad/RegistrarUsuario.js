import bcrypt from 'bcryptjs';
import UsuarioRepository from '../../infrastructure/repositories/UsuarioRepository.js';

export async function registrarUsuario({ nombre, email, password }) {
  // 1. Verificar si el email ya existe
  const existe = await UsuarioRepository.findByEmail(email);
  if (existe) {
    throw new Error('El correo electrónico ya está registrado');
  }

  // 2. Encriptar contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Crear el usuario
  const nuevoUsuario = await UsuarioRepository.create({
    nombre,
    email,
    password: hashedPassword,
    rol: 'CLIENTE',
    activo: true
  });

  // 4. Retornar sin contraseña
  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol
  };
}