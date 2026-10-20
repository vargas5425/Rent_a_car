/* RentCar - comportamiento propio del sitio */
(() => {
  "use strict";

  const raiz = document.documentElement;

  /* ---------- Modo Sleep (oscuro) / Work (claro) ---------- */
  const botonTema = document.getElementById("temaToggle");

  function aplicarTema(tema) {
    raiz.setAttribute("data-theme", tema);
    if (botonTema) botonTema.setAttribute("aria-checked", String(tema === "dark"));
  }

  // Estado inicial: el <head> ya puso el tema guardado; aquí solo sincronizamos el botón
  aplicarTema(raiz.getAttribute("data-theme") === "dark" ? "dark" : "light");

  if (botonTema) {
    botonTema.addEventListener("click", () => {
      const nuevo = raiz.getAttribute("data-theme") === "dark" ? "light" : "dark";
      aplicarTema(nuevo);
      try { localStorage.setItem("rentcar-tema", nuevo); } catch (e) { /* ignorar */ }
    });
  }

  /* ---------- Menú superior: se compacta al bajar ---------- */
  const navbar = document.getElementById("navbar");
  const compactarMenu = () => {
    navbar.classList.toggle("rc-navbar--scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", compactarMenu, { passive: true });
  compactarMenu();

  // Cierra el menú móvil al elegir una opción
  const menu = document.getElementById("menu");
  menu.querySelectorAll("a.nav-link").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      if (menu.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  /* ---------- Botón "Reservar" del carrusel: preselecciona el vehículo ---------- */
  const selectorVehiculo = document.getElementById("vehiculo");
  document.querySelectorAll(".btn-reservar").forEach((boton) => {
    boton.addEventListener("click", () => {
      selectorVehiculo.value = boton.dataset.auto;
      selectorVehiculo.dispatchEvent(new Event("change"));
    });
  });

  /* ---------- Tarifas y cálculo en Bolivianos (Bs.) ----------
     Edita SOLO esta parte para cambiar precios o el tipo de cambio.
     Las tarifas están en dólares (como en las tarjetas) y se convierten a Bs. */
  const TIPO_CAMBIO = 6.96;          // Bs. por 1 USD (ajústalo al valor que uses)
  const TARIFAS = {                  // USD por día y por hora
    "Sedán Económico":  { dia: 35, hora: 6  },
    "SUV Familiar":     { dia: 65, hora: 11 },
    "Camioneta Pickup": { dia: 80, hora: 14 }
  };

  const formatoBs = (n) =>
    "Bs. " + n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- Formulario de reserva ---------- */
  const form = document.getElementById("formReserva");
  const tipo = document.getElementById("tipoAlquiler");
  const recogida = document.getElementById("recogida");
  const devolucion = document.getElementById("devolucion");
  const fechaHora = document.getElementById("fechaHora");
  const horaInicio = document.getElementById("horaInicio");
  const cantHoras = document.getElementById("cantHoras");
  const montoTotal = document.getElementById("montoTotal");
  const detalleMonto = document.getElementById("detalleMonto");
  const aviso = document.getElementById("reservaOk");

  // No permitir fechas pasadas
  const hoy = new Date();
  const iso = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  recogida.min = iso;
  devolucion.min = iso;
  fechaHora.min = iso;
  recogida.addEventListener("change", () => { devolucion.min = recogida.value || iso; });

  // Muestra los campos del tipo elegido y ajusta cuáles son obligatorios
  function cambiarTipo() {
    const porHora = tipo.value === "hora";
    document.querySelectorAll(".bloque-dia").forEach((e) => e.classList.toggle("d-none", porHora));
    document.querySelectorAll(".bloque-hora").forEach((e) => e.classList.toggle("d-none", !porHora));
    recogida.required = devolucion.required = !porHora;
    fechaHora.required = horaInicio.required = cantHoras.required = porHora;
    calcular();
  }

  // Calcula el monto y devuelve el total en Bs. (o 0 si faltan datos)
  function calcular() {
    const t = TARIFAS[selectorVehiculo.value];
    let total = 0, detalle = "Completa los datos para ver el monto";

    if (t && tipo.value === "hora") {
      const h = parseInt(cantHoras.value, 10);
      if (h >= 1 && h <= 24) {
        total = h * t.hora * TIPO_CAMBIO;
        detalle = h + (h === 1 ? " hora" : " horas") + " × " + formatoBs(t.hora * TIPO_CAMBIO);
        if (horaInicio.value) {
          const [hh, mm] = horaInicio.value.split(":").map(Number);
          const fin = hh * 60 + mm + h * 60;
          const finHH = String(Math.floor(fin / 60) % 24).padStart(2, "0");
          const finMM = String(fin % 60).padStart(2, "0");
          detalle += " · devolución " + finHH + ":" + finMM + (fin >= 1440 ? " (día siguiente)" : "");
        }
      }
    } else if (t && recogida.value && devolucion.value && devolucion.value >= recogida.value) {
      // Días de alquiler = diferencia de fechas (mínimo 1 día)
      const ms = new Date(devolucion.value) - new Date(recogida.value);
      const dias = Math.max(1, Math.round(ms / 86400000));
      total = dias * t.dia * TIPO_CAMBIO;
      detalle = dias + (dias === 1 ? " día" : " días") + " × " + formatoBs(t.dia * TIPO_CAMBIO);
    }

    montoTotal.textContent = formatoBs(total);
    detalleMonto.textContent = detalle;
    return total;
  }

  [tipo, selectorVehiculo, recogida, devolucion, fechaHora, horaInicio, cantHoras].forEach((el) => {
    el.addEventListener("change", calcular);
    el.addEventListener("input", calcular);
  });
  cambiarTipo();
  tipo.addEventListener("change", cambiarTipo);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const porHora = tipo.value === "hora";
    const fechasOk = porHora || !recogida.value || !devolucion.value || devolucion.value >= recogida.value;
    devolucion.classList.toggle("is-invalid", !fechasOk);
    if (!form.checkValidity() || !fechasOk) {
      form.reportValidity();
      return;
    }
    const total = formatoBs(calcular());
    aviso.textContent = "¡Solicitud enviada! Total estimado: " + total + ". Te contactaremos pronto para confirmar tu reserva.";
    aviso.classList.remove("d-none");
    form.reset();
    devolucion.min = iso;
    cambiarTipo();
    aviso.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
