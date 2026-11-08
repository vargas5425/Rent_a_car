import { CLASE_ESTADO, ETIQUETA_ESTADO } from '../../utils/reservas';

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`badge rounded-pill ${CLASE_ESTADO[estado] || 'bg-dark'}`}
      data-testid="reserva-estado"
      style={{ padding: '7px 12px', fontSize: '0.8rem' }}
    >
      {ETIQUETA_ESTADO[estado] || estado}
    </span>
  );
}
