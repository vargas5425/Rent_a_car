// El menú se abre solo con CSS (hover / foco). Este script agrega
// soporte para pantallas táctiles: un toque abre o cierra el menú.
(() => {
  const menu   = document.getElementById('social');
  const toggle = document.getElementById('toggle');

  toggle.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    toggle.setAttribute('aria-expanded', String(abierto));
  });

  // Cerrar al tocar fuera o con Escape
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('abierto');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      menu.classList.remove('abierto');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.blur();
    }
  });
})();

/* ---------- Botón "Volver al inicio" ----------
   - Aparece solo cuando se llega al final de la página.
   - Desaparece en cuanto el usuario sube (o se aleja del final). */
(() => {
  const btnSubir = document.getElementById('btnSubir');
  if (!btnSubir) return;

  const MARGEN_FINAL = 150;      // px antes del final que cuentan como "llegó al final"
  let ultimoScroll = window.scrollY;

  function ocultar() {
    btnSubir.classList.remove('mostrar');
    btnSubir.setAttribute('tabindex', '-1');
  }
  function mostrar() {
    btnSubir.classList.add('mostrar');
    btnSubir.removeAttribute('tabindex');
  }

  function revisar() {
    const y = window.scrollY;
    const subiendo = y < ultimoScroll;
    const alFinal = window.innerHeight + y >= document.documentElement.scrollHeight - MARGEN_FINAL;
    const hayScroll = document.documentElement.scrollHeight > window.innerHeight + MARGEN_FINAL;

    if (hayScroll && alFinal && !subiendo) mostrar();
    else ocultar();

    ultimoScroll = y;
  }

  window.addEventListener('scroll', revisar, { passive: true });
  window.addEventListener('resize', revisar);
  revisar();
})();
