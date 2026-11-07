import './InfoSection.css';

export default function InfoSection() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="p-5 bg-white rounded-4 shadow-sm border-start border-4" style={{ borderColor: '#fbbf24' }}>
            <h2 className="fw-bold mb-4">Alquiler de Coches en Bolivia</h2>
            <p className="text-muted lh-lg mb-3">
              Con Tierra Camba, descubrir Bolivia resulta sencillo y flexible desde tu llegada. Desde escapadas urbanas 
              emblemáticas en Santa Cruz hasta estancias soleadas en las mejores playas, viaja a tu propio ritmo y elige 
              un alquiler de vehículo perfectamente adaptado a tus planes.
            </p>
            <p className="text-muted lh-lg mb-3">
              Opte por un modelo compacto para desplazarse y estacionar con facilidad en el centro de la ciudad. Prefiera un 
              vehículo más amplio o un SUV para trayectos largos por autopista, viajes en familia o viajera por carretera con mayor 
              equipaje. Una solución cómoda que le permite recorrer más distancia sin depender de horarios preestablecidos.
            </p>
            <p className="text-muted lh-lg mb-0">
              Su vehículo estará disponible en numerosas oficinas estratégicamente ubicadas en todo el país. Sea cual sea 
              su próximo destino, ponerse en marcha resulta rápido, claro y eficiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}