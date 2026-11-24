import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import app from '../../index.js'; // Tu archivo principal de Express

let server;
const PORT = 4001; // Puerto temporal para tests
const API_URL = `http://localhost:${PORT}/api/auth`;

describe('Auth Integration Tests (sin Supertest)', () => {
  const testEmail = `user_native_${Date.now()}@test.com`;
  const testPassword = 'SecurePassword123';
  let token = '';

  beforeAll(async () => {
    // Levantar el servidor en un puerto de prueba antes de ejecutar los tests
    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    // Cerrar el servidor al terminar
    await new Promise((resolve) => server.close(resolve));
  });

  test('1. POST /api/auth/register - Debe registrar un nuevo usuario exitosamente', async () => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Usuario Nativo',
        email: testEmail,
        password: testPassword
      })
    });

    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.mensaje).toBe('Usuario registrado exitosamente');
    expect(data.usuario).toHaveProperty('email', testEmail);
  });

  test('2. POST /api/auth/login - Debe iniciar sesión con las credenciales creadas y retornar token', async () => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('token');
    expect(data.usuario).toHaveProperty('email', testEmail);
    token = data.token;
  });

  test('3. GET /api/auth/perfil - Debe permitir acceso a ruta protegida usando el token', async () => {
    const res = await fetch(`${API_URL}/perfil`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.mensaje).toBe('Acceso concedido a ruta protegida');
    expect(data.usuario).toHaveProperty('id');
    expect(data.usuario).toHaveProperty('rol');
  });
});