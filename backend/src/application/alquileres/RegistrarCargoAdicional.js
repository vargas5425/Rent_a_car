
const TIPOS_CARGO = [
  'RETRASO',
  'COMBUSTIBLE',
  'DANIO',
  'LIMPIEZA',
  'KILOMETRAJE',
  'OTRO'
];

class RegistrarCargoAdicional {
  constructor(alquilerRepository, cargoAdicionalRepository) {
    this.alquilerRepository = alquilerRepository;
    this.cargoAdicionalRepository = cargoAdicionalRepository;
  }

  async ejecutar(alquilerId, datos) {
    // 1. Validar el ID del alquiler
    const id = Number(alquilerId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('El ID del alquiler no es válido');
    }

    // 2. Buscar el alquiler
    const alquiler = await this.alquilerRepository.buscarPorId(id);

    if (!alquiler) {
      throw new Error('El alquiler no existe');
    }

    // 3. Verificar el estado del alquiler
    if (!['ACTIVO', 'FINALIZADO'].includes(alquiler.estado)) {
      throw new Error(
        'No se pueden registrar cargos en este alquiler'
      );
    }

    // 4. Validar los datos recibidos
    if (!datos || typeof datos !== 'object') {
      throw new Error('Los datos del cargo son obligatorios');
    }

    const { tipo, descripcion, monto } = datos;

    if (!TIPOS_CARGO.includes(tipo)) {
      throw new Error('El tipo de cargo no es válido');
    }

    if (
      typeof descripcion !== 'string' ||
      descripcion.trim() === ''
    ) {
      throw new Error('La descripción es obligatoria');
    }

    const montoNumero = Number(monto);

    if (
      monto === null ||
      monto === undefined ||
      monto === '' ||
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0 ||
      !Number.isInteger(montoNumero * 100)
    ) {
      throw new Error('El monto debe ser positivo y tener máximo dos decimales');
    }

    // 5. Registrar el cargo adicional
    const cargo = await this.cargoAdicionalRepository.crear({
      alquiler_id: id,
      tipo,
      descripcion: descripcion.trim(),
      monto: montoNumero
    });

    // 6. Retornar el cargo registrado
    return cargo;
  }
}

export default RegistrarCargoAdicional;
