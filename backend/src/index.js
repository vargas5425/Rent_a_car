import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './infrastructure/models/index.js';
import authRoutes from './presentation/routes/authRoutes.js'; 
import alquilerRoutes from './presentation/routes/alquilerRoutes.js';
import vehiculoRoutes from './presentation/routes/vehiculoRoutes.js';
import reservaRoutes from './presentation/routes/reservaRoutes.js'; // 👈 Importar
import path from 'path';          // 👈 Importar path
import { fileURLToPath } from 'url'; // 👈 Importar fileURLToPath

// Como usamos ES Modules, necesitamos esto para obtener la ruta actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/reservas', reservaRoutes); // 👈 Montar

// Rutas de alquileres y cargos adicionales
app.use('/api/alquileres', alquilerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rent a Car API funcionando' });
});

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida.');
    
    app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

iniciar();