export const usuarios = {
  cliente: { id: 3, nombre: 'Cliente Demo', email: 'cliente@rentacar.com', rol: 'CLIENTE' },
  empleado: { id: 2, nombre: 'Empleado Demo', email: 'empleado@rentacar.com', rol: 'EMPLEADO' },
  admin: { id: 1, nombre: 'Super Admin', email: 'admin@rentacar.com', rol: 'ADMINISTRADOR' }
};

export const ok = (body, status = 200) => ({ status, body });

export const fallo = (status, error) => ({ status, body: { error } });

export async function iniciarSesion(page, rol) {
  await page.addInitScript((usuario) => {
    localStorage.setItem('token', 'token-e2e');
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }, usuarios[rol]);
}

export async function simularApi(page, rutas) {
  const peticiones = [];

  await page.route('**/api/**', async (route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    const clave = `${peticion.method()} ${url.pathname}`;
    const crudo = peticion.postData();

    peticiones.push({
      clave,
      url: url.href,
      cuerpo: crudo ? JSON.parse(crudo) : null
    });

    const definicion = rutas[clave];

    if (definicion === undefined) {
      await route.fulfill({ status: 404, json: { error: `Sin mock para ${clave}` } });
      return;
    }

    const { status, body } = typeof definicion === 'function' ? await definicion(peticion) : definicion;
    await route.fulfill({ status, json: body });
  });

  return {
    todas: peticiones,
    de: (clave) => peticiones.filter((p) => p.clave === clave)
  };
}

export function responderDialogos(page, aceptar = true) {
  const mensajes = [];

  page.on('dialog', async (dialogo) => {
    mensajes.push(dialogo.message());
    if (aceptar) {
      await dialogo.accept();
    } else {
      await dialogo.dismiss();
    }
  });

  return mensajes;
}
