import { loginUsuario } from '../../application/identidad/LoginUsuario.js';
import UsuarioRepository from '../../infrastructure/repositories/UsuarioRepository.js';
import bcrypt from 'bcryptjs';
import { describe, test, expect, afterEach, vi } from 'vitest';

// Mocks de dependencias con Vitest (vi)
vi.mock('../../infrastructure/repositories/UsuarioRepository.js');
vi.mock('bcryptjs');

describe('LoginUsuario - Test Unitario', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('Debe fallar si el usuario no existe', async () => {
    UsuarioRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUsuario({ email: 'noexiste@correo.com', password: '123' }))
      .rejects
      .toThrow('Credenciales inválidas');
  });

  test('Debe fallar si el usuario está inactivo', async () => {
    UsuarioRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@correo.com',
      activo: false,
      password: 'hashedpassword'
    });

    await expect(loginUsuario({ email: 'test@correo.com', password: '123' }))
      .rejects
      .toThrow('Usuario desactivado');
  });

  test('Debe fallar si la contraseña es incorrecta', async () => {
    UsuarioRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@correo.com',
      activo: true,
      password: 'hashedpassword'
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginUsuario({ email: 'test@correo.com', password: 'wrongpassword' }))
      .rejects
      .toThrow('Credenciales inválidas');
  });
});