import { ESTADOS_RESERVA, ETIQUETA_ESTADO } from '../../utils/reservas';

// Línea de tiempo visual del camino de una reserva:
// Reservada → Confirmada → Entregada → Devuelta → Finalizada.
// Una reserva cancelada no sigue ese camino, así que se muestra aparte.
export default function TimelineEstados({ estado }) {
  if (estado === 'CANCELADA') {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" data-testid="timeline-estados">
        <span aria-hidden="true">✕</span>
        <span>Esta reserva fue cancelada y las fechas quedaron liberadas.</span>
      </div>
    );
  }

  const indiceActual = ESTADOS_RESERVA.indexOf(estado);

  return (
    <ol className="list-unstyled d-flex justify-content-between position-relative mb-0" data-testid="timeline-estados">
      {/* Línea de fondo que une los puntos */}
      <div
        aria-hidden="true"
        className="position-absolute"
        style={{ top: '15px', left: '10%', right: '10%', height: '3px', background: '#e2e8f0' }}
      />
      {ESTADOS_RESERVA.map((paso, i) => {
        const completado = i < indiceActual;
        const actual = i === indiceActual;
        const color = completado || actual ? 'var(--brand-primary, #0f172a)' : '#cbd5e1';

        return (
          <li
            key={paso}
            className="text-center position-relative"
            style={{ flex: 1 }}
            data-estado={paso}
            data-activo={actual ? 'true' : 'false'}
            aria-current={actual ? 'step' : undefined}
          >
            <div
              className="mx-auto d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: completado ? color : '#fff',
                border: `3px solid ${color}`,
                color: completado ? '#fff' : color,
                boxShadow: actual ? '0 0 0 5px rgba(59, 130, 246, 0.25)' : 'none'
              }}
            >
              {completado ? '✓' : i + 1}
            </div>
            <div
              className="mt-2"
              style={{ fontSize: '0.8rem', fontWeight: actual ? 700 : 500, color: actual ? color : '#64748b' }}
            >
              {ETIQUETA_ESTADO[paso]}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
