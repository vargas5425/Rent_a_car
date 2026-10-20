import bcrypt from 'bcryptjs';
import UsuarioRepository from '../../infrastructure/repositories/UsuarioRepository.js';

export async function registrarUsuario({ nombre, email, password, rol }) {
  // 1. Verificar si el email ya existe
  const usuarioExistente = await UsuarioRepository.findByEmail(email);
  if (usuarioExistente) {
    throw new Error('El correo electrónico ya está registrado');
  }

  // 2. Encriptar la contraseña 
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Crear el usuario en la base de datos
  const nuevoUsuario = await UsuarioRepository.create({
    nombre,
    email,
    password: hashedPassword,
    rol: rol || 'CLIENTE',
    activo: true
  });

  // 4. Devolver los datos 
  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol
  };
}