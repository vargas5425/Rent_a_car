
/**
 * Calcula el cargo por combustible faltante.
 *
 * Regla de negocio:
 * - Bs 50 por cada 25 puntos porcentuales faltantes.
 * - Las fracciones se redondean hacia arriba.
 * - Si no falta combustible, no se cobra.
 */

export function calcularCargoCombustible({
  combustible_inicial,
  combustible_final
}) {
  // 1. Convertir valores a números
  const inicial = Number(combustible_inicial);
  const final = Number(combustible_final);

  // 2. Validar los porcentajes
  if (
    combustible_inicial === null ||
    combustible_inicial === undefined ||
    combustible_inicial === '' ||
    combustible_final === null ||
    combustible_final === undefined ||
    combustible_final === '' ||
    !Number.isInteger(inicial) ||
    !Number.isInteger(final) ||
    inicial < 0 ||
    inicial > 100 ||
    final < 0 ||
    final > 100
  ) {
    throw new Error('Los niveles de combustible deben estar entre 0 y 100');
  }

  // 3. Calcular cuánto combustible falta
  const combustibleFaltante = Math.max(0, inicial - final);

  // 4. Si no falta combustible, no generar cargo
  if (combustibleFaltante === 0) {
    return {
      combustible_faltante: 0,
      bloques_cobrados: 0,
      monto: 0
    };
  }

  // 5. Calcular bloques de 25 puntos porcentuales
  const bloquesCobrados = Math.ceil(combustibleFaltante / 25);

  // 6. Calcular cargo
  const monto = bloquesCobrados * 50;

  return {
    combustible_faltante: combustibleFaltante,
    bloques_cobrados: bloquesCobrados,
    monto
  };
}
