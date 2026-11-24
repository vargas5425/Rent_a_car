// backend/src/domain/tarifas/TarifaService.js

// 👇 EL DOMINIO ES 100% PURO (Sin base de datos, sin Express, solo reglas de negocio)

export function calcularPrecio(duracionEnHoras, modalidad, precioBase) {
  if (duracionEnHoras <= 0) throw new Error('La duración debe ser mayor a 0');
  if (precioBase <= 0) throw new Error('El precio base debe ser mayor a 0');

  let unidadesACobrar = 0;
  switch (modalidad) {
    case 'HORA': unidadesACobrar = Math.ceil(duracionEnHoras); break;
    case 'DIA': unidadesACobrar = Math.ceil(duracionEnHoras / 24); break;
    case 'SEMANA': unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 7)); break;
    case 'MES': unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 30)); break;
    default: throw new Error('Modalidad no válida');
  }
  return unidadesACobrar * precioBase;
}

export async function calcularPrecioReserva(vehiculo, duracionEnHoras, modalidad, tarifaRepo) {
  const tarifasVehiculo = await tarifaRepo.buscarPorVehiculo(vehiculo.id);
  const tarifaVehiculo = tarifasVehiculo.find(t => t.modalidad === modalidad);

  if (tarifaVehiculo) {
    return calcularPrecio(duracionEnHoras, modalidad, tarifaVehiculo.precio);
  }

  const tarifasCategoria = await tarifaRepo.buscarPorCategoria(vehiculo.categoria_id);
  const tarifaCategoria = tarifasCategoria.find(t => t.modalidad === modalidad);

  if (tarifaCategoria) {
    return calcularPrecio(duracionEnHoras, modalidad, tarifaCategoria.precio);
  }

  throw new Error('No hay tarifa configurada para este vehículo ni para su categoría');
}

export async function generarSnapshotTarifa(vehiculo, duracionEnHoras, modalidad, tarifaRepo) {
  const tarifasVehiculo = await tarifaRepo.buscarPorVehiculo(vehiculo.id);
  let tarifaAplicada = tarifasVehiculo.find(t => t.modalidad === modalidad);

  if (!tarifaAplicada) {
    const tarifasCategoria = await tarifaRepo.buscarPorCategoria(vehiculo.categoria_id);
    tarifaAplicada = tarifasCategoria.find(t => t.modalidad === modalidad);
  }

  if (!tarifaAplicada) {
    throw new Error('No hay tarifa configurada para este vehículo ni para su categoría');
  }

  const precioTotal = calcularPrecio(duracionEnHoras, modalidad, tarifaAplicada.precio);

  return {
    tarifa_id: tarifaAplicada.id,
    modalidad_aplicada: modalidad,
    precio_unitario_al_momento: tarifaAplicada.precio,
    duracion_cobrada: duracionEnHoras,
    precio_total_calculado: precioTotal
  };
}

// ---------------------------------------------------------------------------
// 👇 NUEVAS REGLAS DE NEGOCIO (Migradas de tu compañero a Dominio)
// ---------------------------------------------------------------------------

/**
 * Calcula el cargo por retraso en la devolución.
 * Modalidades: HORA (1h), DIA (24h), SEMANA (168h), MES (720h).
 * Cada hora iniciada se cobra completa.
 */
export function calcularCargoRetraso({
  fecha_fin,
  fecha_devolucion,
  modalidad,
  precio_unitario,
  tarifa_diaria
}) {
  const fechaLimite = new Date(fecha_fin);
  const fechaReal = new Date(fecha_devolucion);

  if (!Number.isFinite(fechaLimite.getTime()) || !Number.isFinite(fechaReal.getTime())) {
    throw new Error('Las fechas de devolución no son válidas');
  }

  // Compatibilidad con alquileres antiguos que solo tienen tarifa_diaria.
  const modalidadAplicada = modalidad || 'DIA';
  const precioAplicado = precio_unitario != null ? Number(precio_unitario) : Number(tarifa_diaria);

  const horasPorModalidad = { HORA: 1, DIA: 24, SEMANA: 168, MES: 720 };
  const horasUnidad = horasPorModalidad[modalidadAplicada];

  if (!horasUnidad) throw new Error('La modalidad del alquiler no es válida');
  if ((precio_unitario == null && tarifa_diaria == null) || !Number.isFinite(precioAplicado) || precioAplicado < 0) {
    throw new Error('El precio del alquiler no es válido');
  }

  const diferencia = fechaReal.getTime() - fechaLimite.getTime();
  if (diferencia <= 0) return { horas_retraso: 0, monto: 0 };

  const horasRetraso = Math.ceil(diferencia / (1000 * 60 * 60));
  
  // Cálculo en centavos para evitar problemas de coma flotante
  const precioCentavos = Math.round(precioAplicado * 100);
  const montoCentavos = Math.round((precioCentavos * horasRetraso) / horasUnidad);

  return { horas_retraso: horasRetraso, monto: montoCentavos / 100 };
}

/**
 * Calcula el cargo por combustible faltante usando porcentajes (0-100).
 * Regla: Bs 50 por cada 25% faltante. Fracciones se redondean hacia arriba.
 */
export function calcularCargoCombustible({ combustible_inicial, combustible_final }) {
  const inicial = Number(combustible_inicial);
  const final = Number(combustible_final);

  if (
    combustible_inicial === null || combustible_inicial === undefined || combustible_inicial === '' ||
    combustible_final === null || combustible_final === undefined || combustible_final === '' ||
    !Number.isInteger(inicial) || !Number.isInteger(final) ||
    inicial < 0 || inicial > 100 || final < 0 || final > 100
  ) {
    throw new Error('Los niveles de combustible deben estar entre 0 y 100');
  }

  const combustibleFaltante = Math.max(0, inicial - final);

  if (combustibleFaltante === 0) {
    return { combustible_faltante: 0, bloques_cobrados: 0, monto: 0 };
  }

  const bloquesCobrados = Math.ceil(combustibleFaltante / 25);
  const monto = bloquesCobrados * 50;

  return { combustible_faltante: combustibleFaltante, bloques_cobrados: bloquesCobrados, monto };
}