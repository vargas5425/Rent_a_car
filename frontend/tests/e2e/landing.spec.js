import { test, expect } from '@playwright/test';

test.describe('E2E 00: Carga de Landing Page', () => {

  test('Debe cargar la página principal con sus elementos clave', async ({ page }) => {
    // 1. Ir a la página principal
    await page.goto('/');
    
    // 2. Verificar que el Navbar tenga el logo/nombre de la marca
    await expect(page.locator('nav')).toContainText('Tierra Camba');
    
    // 3. Verificar que el Hero (portada) tenga el título principal
    await expect(page.locator('h1')).toContainText('Premium');
    
    // 4. Verificar que los botones de Login y Registro estén visibles
    await expect(page.getByRole('link', { name: 'Iniciar Sesión' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Registrarse' })).toBeVisible();
  });

  test('Debe mostrar el carrusel de marcas', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la sección de marcas exista
    const marcasSection = page.locator('.brands-section');
    await expect(marcasSection).toBeVisible();
  });

  test('Debe poder cambiar al Modo Oscuro', async ({ page }) => {
    await page.goto('/');
    
    // Buscar el botón de Work/Sleep y hacer clic
    const themeToggle = page.locator('.rc-theme');
    await expect(themeToggle).toBeVisible();
    
    await themeToggle.click();
    
    // Verificar que el atributo data-theme del HTML cambió a "dark"
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});


/*
EJECUTAR TEST DESDE CONTENEDOR DOCKER:
docker exec -it rentacar_frontend sh
npx playwright test
exit
*/