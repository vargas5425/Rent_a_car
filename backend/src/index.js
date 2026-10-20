import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './infrastructure/models/index.js';
import authRoutes from './presentation/routes/authRoutes.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rent a Car API funcionando' });
});

async function iniciar() {
  try {
    await sequelize.authenticate();
    
    console.log('Conexión a MySQL establecida.');

    await sequelize.sync({ alter: true }); 
    console.log('Tablas sincronizadas con la base de datos.');
    
    app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

iniciar();