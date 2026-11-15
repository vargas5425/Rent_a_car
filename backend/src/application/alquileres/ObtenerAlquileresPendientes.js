
class ObtenerAlquileresPendientes {
  constructor(alquilerRepository) {
    this.alquilerRepository = alquilerRepository;
  }

  async ejecutar() {
    return await this.alquilerRepository.listarPorEstado(
      'PENDIENTE'
    );
  }
}

export default ObtenerAlquileresPendientes;
