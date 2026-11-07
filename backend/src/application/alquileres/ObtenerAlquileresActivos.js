
class ObtenerAlquileresActivos {

  constructor(alquilerRepository) {
    // Repositorio inyectado como dependencia
    this.alquilerRepository = alquilerRepository;
  }

  async ejecutar() {
    // Consultar alquileres en estado ACTIVO
    const alquileres = await this.alquilerRepository.listarPorEstado(
      'ACTIVO'
    );

    // Devolver los alquileres encontrados
    return alquileres;
  }
}

export default ObtenerAlquileresActivos;
