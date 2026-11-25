import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, usuarios, iniciarSesion, responderDialogos } from '../support/api.js';
import { crearFlota } from '../support/datos.js';

async function enviarLogin(page, email, password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: 'Entrar al sistema' }).click();
}

async function enviarRegistro(page, nombre, email, password) {
  await page.goto('/register');
  await page.fill('input[name="nombre"]', nombre);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole('button', { name: 'Registrarse' }).click();
}

test.describe('Login', () => {
  test('el cliente entra a la flota y guarda la sesión', async ({ page }) => {
    const api = await simularApi(page, {
      'POST /api/auth/login': ok({ token: 'jwt-cliente', usuario: usuarios.cliente }),
      'GET /api/vehiculos': ok(crearFlota(2))
    });

    await enviarLogin(page, 'cliente@rentacar.com', 'cliente123');

    await expect(page).toHaveURL(/\/vehiculos$/);
    await expect(page.locator('.user-name')).toHaveText('Hola, Cliente Demo');
    expect(api.de('POST /api/auth/login')[0].cuerpo).toEqual({
      email: 'cliente@rentacar.com',
      password: 'cliente123'
    });
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('jwt-cliente');
  });

  for (const rol of ['admin', 'empleado']) {
    test(`el ${rol} entra al dashboard`, async ({ page }) => {
      await simularApi(page, {
        'POST /api/auth/login': ok({ token: `jwt-${rol}`, usuario: usuarios[rol] })
      });

      await enviarLogin(page, usuarios[rol].email, 'clave-segura');

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
      await expect(page.locator('.user-name')).toHaveText(`Hola, ${usuarios[rol].nombre}`);
    });
  }

  test('con credenciales inválidas muestra el error y no guarda sesión', async ({ page }) => {
    await simularApi(page, {
      'POST /api/auth/login': fallo(401, 'Credenciales inválidas')
    });

    await enviarLogin(page, 'cliente@rentacar.com', 'incorrecta');

    await expect(page.locator('.alert-danger')).toHaveText('Credenciales inválidas');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });

  test('exige correo y contraseña antes de enviar', async ({ page }) => {
    const api = await simularApi(page, {});

    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar al sistema' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(api.de('POST /api/auth/login')).toHaveLength(0);
  });

  test('enlaza con el registro y con el inicio', async ({ page }) => {
    await simularApi(page, {});

    await page.goto('/login');
    await page.getByRole('link', { name: 'Regístrate aquí' }).click();
    await expect(page).toHaveURL(/\/register$/);

    await page.getByRole('link', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Registro', () => {
  test('crea la cuenta, avisa y redirige al login', async ({ page }) => {
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      'POST /api/auth/register': ok({ mensaje: 'Usuario registrado' }, 201)
    });

    await enviarRegistro(page, 'Lucía Mamani', 'lucia@correo.com', 'secreto123');

    await expect(page).toHaveURL(/\/login$/);
    expect(mensajes[0]).toContain('Registro exitoso');
    expect(api.de('POST /api/auth/register')[0].cuerpo).toEqual({
      nombre: 'Lucía Mamani',
      email: 'lucia@correo.com',
      password: 'secreto123'
    });
  });

  test('muestra el error cuando el correo ya existe', async ({ page }) => {
    await simularApi(page, {
      'POST /api/auth/register': fallo(409, 'El email ya está registrado')
    });

    await enviarRegistro(page, 'Lucía Mamani', 'lucia@correo.com', 'secreto123');

    await expect(page.locator('.alert-danger')).toHaveText('El email ya está registrado');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('no envía el formulario con una contraseña de menos de 6 caracteres', async ({ page }) => {
    const api = await simularApi(page, {});

    await enviarRegistro(page, 'Lucía Mamani', 'lucia@correo.com', 'abc');

    await expect(page).toHaveURL(/\/register$/);
    expect(api.de('POST /api/auth/register')).toHaveLength(0);
  });

  test('enlaza con el login', async ({ page }) => {
    await simularApi(page, {});

    await page.goto('/register');
    await page.getByRole('link', { name: 'Inicia sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Cierre de sesión', () => {
  test('el botón Salir limpia la sesión y vuelve a la landing', async ({ page }) => {
    await iniciarSesion(page, 'cliente');
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto('/vehiculos');
    await page.locator('.btn-logout').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.btn-login')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('usuario'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
