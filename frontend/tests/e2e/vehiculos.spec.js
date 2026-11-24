import { test, expect } from '@playwright/test';

test.describe('E2E: Módulo de Vehículos', () => {

  // Test 1: Cliente consulta vehículos
  test('Cliente puede ver la lista de vehículos', async ({ page }) => {
    // 1. Login como cliente
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alfredito512@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // 2. Esperar a que cargue la página de vehículos
    await expect(page).toHaveURL('/vehiculos');
    await expect(page.getByText('Nuestra Flota')).toBeVisible();
    
    // 3. Verificar que haya al menos una tarjeta de vehículo
    const tarjetas = page.locator('.card');
    await expect(tarjetas.first()).toBeVisible();
  });

  // Test 2: Admin gestiona vehículos
  test('Admin puede ver la tabla de gestión de vehículos', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@rentacar.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Ir directo a la gestión de vehículos
    await page.goto('/dashboard/admin/vehiculos');
    
    // 3. Verificar que el título esté visible
    await expect(page.getByRole('heading', { name: 'Gestión de Vehículos' })).toBeVisible();
    
    // 4. Verificar que exista el botón de crear
    await expect(page.getByRole('link', { name: '+ Nuevo Vehículo' })).toBeVisible();
  });

  // Test 3: Cliente NO puede gestionar vehículos
  test('Cliente no puede acceder a la gestión de vehículos', async ({ page }) => {
    // 1. Login como cliente
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cliente@rentacar.com');
    await page.fill('input[type="password"]', 'cliente123');
    await page.click('button[type="submit"]');

    // 2. Intentar entrar a la ruta de admin
    await page.goto('/dashboard/admin/vehiculos');
    
    // 3. Verificar que el sistema lo redirija fuera de la página de admin
    await expect(page).not.toHaveURL('/dashboard/admin/vehiculos');
  });

});