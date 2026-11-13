// backend/migrarPrecios.js
import { sequelize, VehiculoModel, TarifaModel } from './src/infrastructure/models/index.js';

async function migrar() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos...');

    const vehiculos = await VehiculoModel.findAll();
    let contador = 0;

    for (const auto of vehiculos) {
      // Copiar el precio por HORA
      if (auto.precio_hora > 0) {
        await TarifaModel.create({
          vehiculo_id: auto.id,
          modalidad: 'HORA',
          precio: auto.precio_hora
        });
        contador++;
      }

      // Copiar el precio por DIA
      if (auto.precio_dia > 0) {
        await TarifaModel.create({
          vehiculo_id: auto.id,
          modalidad: 'DIA',
          precio: auto.precio_dia
        });
        contador++;
      }
    }

    console.log(`✅ ¡Migración exitosa! Se crearon ${contador} tarifas en la nueva tabla.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrar();