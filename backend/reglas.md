1. Intervalos de Tiempo (La regla crítica)
   Formato matemático: Usaremos intervalos semiabiertos [inicio, fin).

¿Qué significa? Que si un auto se reserva de 10:00 a 14:00, otro cliente SÍ puede reservarlo a partir de las 14:00. Las 14:00 pertenecen a la nueva reserva, no a la anterior.

Consecuencia: Dos reservas son válidas si fin_reserva_1 <= inicio_reserva_2 (o viceversa). Si se cruzan aunque sea un minuto, hay solapamiento.

Zona Horaria: Usaremos la hora local del servidor (sin UTC por ahora para no complicar los tests, pero documentado).

Fechas Pasadas: No se puede reservar para una fecha que ya pasó.

2. Tarifas y Cálculos (Precios)
   Redondeo: Cualquier fracción de tiempo se cobra como la unidad completa.

Si la tarifa es por HORA y el alquiler dura 4 horas y 15 minutos, se cobran 5 horas.

Si es por DÍA y dura 1 día y 2 horas, se cobran 2 días.

Historial de precios: Cuando se crea una reserva, se guarda una "foto" del precio. Si el administrador sube el precio del vehículo mañana, la reserva de ayer no cambia.

Método de pago: Los pagos pueden ser en efectivo, tarjeta o transferencia, pero nunca pueden superar el saldo pendiente total. El saldo jamás puede ser negativo.

3. Disponibilidad y Estados
   Estados bloqueantes: Un vehículo NO se puede reservar si está en estado MANTENIMIENTO.

Estados de reserva bloqueantes: Si un vehículo tiene una reserva en estado RESERVADA, CONFIRMADA, ENTREGADA o EN_ALQUILER, esas fechas están bloqueadas.

Liberación: Si una reserva pasa a CANCELADA, esas fechas se liberan inmediatamente y el vehículo vuelve a estar DISPONIBLE si no tenía otras reservas.

Alquiler: Al entregar el vehículo, este pasa a ALQUILADA. Al devolverlo, el empleado decide si vuelve a DISPONIBLE o si pasa a MANTENIMIENTO (si detecta daños).

4. Flujo de Estados (Máquina de Estados)
   Reserva:
   RESERVADA → CONFIRMADA → ENTREGADA (pasa a ser Alquiler) → DEVUELTA → FINALIZADA.

Cancelación: Solo se puede cancelar si está en RESERVADA o CONFIRMADA.

Transiciones prohibidas: No puedes entregar una reserva CANCELADA. No puedes devolver algo que nunca se entregó.

5. Seguridad y Roles
   Cliente: Solo puede ver y modificar (cancelar) sus propias reservas y pagos.

Empleado: Puede ver todas las reservas, entregar, recibir y registrar pagos.

Administrador: Puede hacer todo lo del empleado + gestionar usuarios, vehículos, tarifas y mantenimientos.

Contraseñas: Usaremos bcrypt (con salt incorporado). Las contraseñas en texto plano jamás se guardan en la BD.

6. Reglas de los Tests Unitarios (El checklist del PDF)
   Para cumplir con lo que pide el proyecto, escribiremos tests unitarios que prueben exactamente esto:

Test de Solapamiento: Verificar que 10:00-14:00 y 12:00-16:00 chocan; y que 10:00-14:00 y 14:00-18:00 NO chocan.

Test de Precios: Verificar que 4 horas de un auto de Bs 40/h = Bs 160. Y que 1 día y 2 horas = 2 días de cobro.

Test de Saldo Negativo: Intentar pagar Bs 2.000 cuando el total es Bs 1.500 y verificar que el sistema lanza un error.

Test de Transiciones: Intentar entregar una reserva CANCELADA y verificar que el sistema lo rechaza.

Test de Retraso: Devolver un auto 2 horas tarde y verificar que se calcula el cargo extra.

## Reglas Confirmadas

Intervalos: [inicio, fin). Contiguos (14:00-18:00 después de 10:00-14:00) son válidos.

Precios: Se redondea hacia arriba (4.5 horas = 5 horas).

Retraso: Se cobra la tarifa por hora × horas de retraso (redondeado hacia arriba).

Combustible: Bs 50 por cada cuarto faltante (ej. de LLENO a 1/2 son 2 cuartos = Bs 100).

Mantenimiento: Bloquea el auto indefinidamente hasta que el Admin lo libere.

Pagos: El saldo nunca puede ser negativo.
