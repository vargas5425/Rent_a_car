import { test, expect } from '@playwright/test';

test.describe('E2E 00: Carga de Landing Page y Navbar', () => {

  test('Debe cargar la página principal con sus elementos clave', async ({ page }) => {
    await page.goto('/');
    
    // 1. Verificar que el Navbar tenga el nombre de la marca ("Tierra Camba")
    await expect(page.locator('.navbar-custom')).toContainText('Tierra Camba');
    
    // 2. Verificar que el Hero tenga el título principal
    await expect(page.locator('h1')).toContainText('Premium');
    
    // 3. Verificar que los botones de Login y Registro estén visibles
    await expect(page.locator('.btn-login')).toHaveText('Iniciar Sesión');
    await expect(page.locator('.btn-register')).toHaveText('Registrarse');
  });

  test('Debe mostrar el carrusel de marcas y la sección de info', async ({ page }) => {
    await page.goto('/');
    const marcasSection = page.locator('.brands-section');
    await expect(marcasSection).toBeVisible();
  });

  test('Debe poder cambiar al Modo Oscuro usando el componente ThemeToggle', async ({ page }) => {
    await page.goto('/');
    
    // Buscar el switch de tema (.rc-theme)
    const themeToggle = page.locator('.rc-theme');
    await expect(themeToggle).toBeVisible();
    
    await themeToggle.click();
    
    // Verificar que el atributo data-theme del HTML cambió a "dark"
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('Debe ocultar los enlaces de navegación en pantallas móviles (Responsive)', async ({ page }) => {
    // Simular pantalla pequeña (móvil < 768px definido en tu CSS)
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto('/');

    // En tu CSS, los enlaces .nav-link-custom tienen display: none en móviles
    const navLink = page.locator('.nav-link-custom').first();
    await expect(navLink).not.toBeVisible();
  });

  test('Debe mostrar el Navbar adaptado para el rol CLIENTE', async ({ page }) => {
    await page.goto('/');
    
    // Inyectar estado simulado de sesión para CLIENTE en localStorage
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({
        nombre: 'Carlos Pérez',
        rol: 'CLIENTE'
      }));
    });

    await page.reload();

    // Validar enlaces exclusivos de cliente
    await expect(page.locator('.navbar-links')).toContainText('List Cars');
    await expect(page.locator('.navbar-links')).toContainText('Mis Reservas');
    await expect(page.locator('.user-name')).toContainText('Hola, Carlos Pérez');
    await expect(page.locator('.btn-logout')).toBeVisible();
  });

  test('Debe mostrar el Navbar adaptado para el rol ADMINISTRADOR', async ({ page }) => {
    await page.goto('/');
    
    // Inyectar estado simulado de sesión para ADMINISTRADOR
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({
        nombre: 'Admin Master',
        rol: 'ADMINISTRADOR'
      }));
    });

    await page.reload();

    // Validar enlaces exclusivos de staff/admin
    await expect(page.locator('.navbar-links')).toContainText('List Cars');
    await expect(page.locator('.navbar-links')).toContainText('Dashboard');
    await expect(page.locator('.navbar-links')).toContainText('Gestión Reservas');
    await expect(page.locator('.user-name')).toContainText('Hola, Admin Master');
  });

  test('Debe mostrar la sección del Footer con su contenido clave', async ({ page }) => {
    await page.goto('/');

    // Hacer scroll hasta el fondo para asegurar visibilidad del footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});


/*
EJECUTAR TEST DESDE CONTENEDOR DOCKER:
docker exec -it rentacar_frontend sh
npx playwright test
exit
*/