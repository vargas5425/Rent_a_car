import { registrarUsuario } from '../../application/identidad/RegistrarUsuario.js';
import { loginUsuario } from '../../application/identidad/LoginUsuario.js';

export async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const usuario = await registrarUsuario({ nombre, email, password });
    
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario
    });
  } catch (error) {
    if (error.message === 'El correo electrónico ya está registrado') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const resultado = await loginUsuario({ email, password });
    
    res.status(200).json({
      mensaje: 'Login exitoso',
      ...resultado
    });
  } catch (error) {
    if (error.message === 'Credenciales inválidas' || error.message === 'Usuario desactivado') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
}