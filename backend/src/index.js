import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './infrastructure/models/index.js';
import authRoutes from './presentation/routes/authRoutes.js';
import vehiculoRoutes from './presentation/routes/vehiculoRoutes.js';
import reservaRoutes from './presentation/routes/reservaRoutes.js';
import categoriaRoutes from './presentation/routes/categoriaRoutes.js';
import tarifaRoutes from './presentation/routes/tarifaRoutes.js';
import alquilerRoutes from './presentation/routes/alquilerRoutes.js';
import errorHandler from './presentation/middlewares/errorHandler.js';
import pagoRoutes from './presentation/routes/pagoRoutes.js';
import usuarioRoutes from './presentation/routes/usuarioRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/tarifas', tarifaRoutes);
app.use('/api/alquileres', alquilerRoutes);
app.use('/api/alquileres', pagoRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rent a Car API funcionando' });
});

app.use(errorHandler);

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida.');

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Backend corriendo en http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

if (process.env.NODE_ENV !== 'test') {
  iniciar();
} else {
  sequelize.authenticate().catch(() => {});
}

export default app;