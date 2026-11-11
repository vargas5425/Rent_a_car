import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Como usamos ES Modules, necesitamos esto para obtener la ruta actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de dónde y cómo se guardan los archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guarda en la carpeta 'uploads' que está en la raíz del backend
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    // Nombre único para evitar sobreescribir imágenes
    const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, nombreUnico);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

export const upload = multer({ storage, fileFilter });