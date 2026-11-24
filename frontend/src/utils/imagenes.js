import vehiFallback from '../assets/images/vehi.jpg';

/**
 * Devuelve la URL completa de una imagen.
 * Si la imagen es una ruta local del backend (/uploads/...), le agrega el origen del backend.
 */
export function obtenerUrlImagen(imagen_url) {
  if (!imagen_url) return vehiFallback;

  if (imagen_url.startsWith('blob:') || imagen_url.startsWith('data:')) {
    return imagen_url;
  }

  if (imagen_url.startsWith('http://') || imagen_url.startsWith('https://')) {
    return imagen_url;
  }

  if (imagen_url.startsWith('/uploads')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${imagen_url}`;
  }

  return vehiFallback;
}