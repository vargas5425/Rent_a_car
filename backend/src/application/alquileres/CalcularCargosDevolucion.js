
/**
 * Calcula el cargo por retraso en la devolución.
 *
 * Modalidades:
 * HORA:   precio por 1 hora
 * DIA:    precio por 24 horas
 * SEMANA: precio por 168 horas
 * MES:    precio por 720 horas (30 días)
 *
 * Cada hora de retraso iniciada se cobra completa.
 * Los importes se redondean a centavos.
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

  // 1. Validar fechas
  if (
    !Number.isFinite(fechaLimite.getTime()) ||
    !Number.isFinite(fechaReal.getTime())
  ) {
    throw new Error('Las fechas de devolución no son válidas');
  }

  // 2. Determinar modalidad y precio histórico
  // Compatibilidad con alquileres antiguos que solo
  // tienen tarifa_diaria.
  const modalidadAplicada = modalidad || 'DIA';

  const precioAplicado =
    precio_unitario != null
      ? Number(precio_unitario)
      : Number(tarifa_diaria);

  const horasPorModalidad = {
    HORA: 1,
    DIA: 24,
    SEMANA: 168,
    MES: 720
  };

  const horasUnidad = horasPorModalidad[modalidadAplicada];

  if (!horasUnidad) {
    throw new Error('La modalidad del alquiler no es válida');
  }

  if (
    (precio_unitario == null && tarifa_diaria == null) ||
    !Number.isFinite(precioAplicado) ||
    precioAplicado < 0
  ) {
    throw new Error('El precio del alquiler no es válido');
  }

  // 3. Calcular diferencia entre devolución y fecha límite
  const diferencia =
    fechaReal.getTime() - fechaLimite.getTime();

  // 4. Sin retraso
  if (diferencia <= 0) {
    return {
      horas_retraso: 0,
      monto: 0
    };
  }

  // 5. Cada hora iniciada cuenta como una hora completa
  const horasRetraso = Math.ceil(
    diferencia / (1000 * 60 * 60)
  );

  // 6. Calcular cargo usando el precio histórico
  const precioCentavos = Math.round(precioAplicado * 100);

  const montoCentavos = Math.round(
    (precioCentavos * horasRetraso) / horasUnidad
  );

  return {
    horas_retraso: horasRetraso,
    monto: montoCentavos / 100
  };
}
