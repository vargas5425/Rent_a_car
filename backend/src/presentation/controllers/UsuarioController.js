import bcrypt from 'bcryptjs';
import UsuarioRepository from '../../infrastructure/repositories/UsuarioRepository.js';

const ROLES_VALIDOS = ['CLIENTE', 'EMPLEADO', 'ADMINISTRADOR'];

export async function listarUsuarios(req, res) {
  try {
    const usuarios = await UsuarioRepository.findAll();
    res.status(200).json({ usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

export async function crearUsuario(req, res) {
  try {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rol = ROLES_VALIDOS.includes(req.body?.rol) ? req.body.rol : 'CLIENTE';
    const activo = req.body?.activo !== undefined ? Boolean(req.body.activo) : true;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    const existe = await UsuarioRepository.findByEmail(email);
    if (existe) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const creado = await UsuarioRepository.create({
      nombre,
      email,
      password: hashedPassword,
      rol,
      activo
    });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id: creado.id,
        nombre: creado.nombre,
        email: creado.email,
        rol: creado.rol,
        activo: creado.activo
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

export async function actualizarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const actual = await UsuarioRepository.findById(id);
    if (!actual) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const datos = {};
    if (typeof req.body?.nombre === 'string' && req.body.nombre.trim()) {
      datos.nombre = req.body.nombre.trim();
    }
    if (typeof req.body?.email === 'string' && req.body.email.trim()) {
      const emailNormalizado = req.body.email.trim().toLowerCase();
      const otroConEmail = await UsuarioRepository.findByEmail(emailNormalizado);
      if (otroConEmail && Number(otroConEmail.id) !== id) {
        return res.status(409).json({ error: 'El correo electrónico ya está en uso' });
      }
      datos.email = emailNormalizado;
    }
    if (req.body?.rol && ROLES_VALIDOS.includes(req.body.rol)) {
      datos.rol = req.body.rol;
    }
    if (req.body?.activo !== undefined) {
      datos.activo = Boolean(req.body.activo);
    }
    if (typeof req.body?.password === 'string' && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      datos.password = await bcrypt.hash(req.body.password, salt);
    }

    const actualizado = await UsuarioRepository.update(id, datos);
    res.status(200).json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: actualizado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

export async function eliminarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    if (req.usuario && Number(req.usuario.id) === id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario en sesión' });
    }

    const eliminado = await UsuarioRepository.delete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        error: 'No se puede eliminar el usuario porque tiene registros asociados; puedes desactivarlo.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}