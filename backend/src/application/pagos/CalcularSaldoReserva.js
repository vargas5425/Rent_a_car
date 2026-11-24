
/**
 * Calcula el total a pagar de una reserva,
 * incluyendo cargos adicionales y pagos confirmados.
 *
 * Todos los importes se calculan en centavos
 * para evitar errores de precisión decimal.
 */

function aCentavos(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error('El monto debe ser un número válido y no negativo');
  }

  return Math.round(numero * 100);
}

function aBolivianos(centavos) {
  return centavos / 100;
}

export function calcularSaldoReserva({
  totalReserva,
  cargosAdicionales = [],
  pagos = []
}) {
  const totalBase = aCentavos(totalReserva);

  const totalCargos = cargosAdicionales
    .reduce((acumulado, cargo) => {
      return acumulado + aCentavos(cargo.monto);
    }, 0);

  const totalPagado = pagos
    .filter(pago => pago.estado === 'CONFIRMADO')
    .reduce((acumulado, pago) => {
      return acumulado + aCentavos(pago.monto);
    }, 0);

  const totalFinal = totalBase + totalCargos;
  const saldo = totalFinal - totalPagado;

  return {
    totalBase: aBolivianos(totalBase),
    totalCargos: aBolivianos(totalCargos),
    totalFinal: aBolivianos(totalFinal),
    totalPagado: aBolivianos(totalPagado),
    saldoPendiente: aBolivianos(saldo)
  };
}

export function validarMontoPago(monto, saldoPendiente) {
  const montoCentavos = aCentavos(monto);
  const saldoCentavos = aCentavos(saldoPendiente);

  if (montoCentavos <= 0) {
    throw new Error('El monto del pago debe ser mayor a cero');
  }

  if (montoCentavos > saldoCentavos) {
    throw new Error(
      'El monto del pago supera el saldo pendiente de la reserva'
    );
  }

  return true;
}
