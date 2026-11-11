// frontend/src/utils/imagenes.js

/**
 * Devuelve la URL completa de una imagen.
 * Si la imagen es una ruta local del backend (/uploads/...), le agrega el dominio del servidor.
 */
export function obtenerUrlImagen(imagen_url) {
  if (!imagen_url) return 'https://via.placeholder.com/300x200?text=Sin+Imagen';
  
  // Si ya es un enlace externo (http), lo devolvemos tal cual
  if (imagen_url.startsWith('http')) return imagen_url;
  
  // Si es una imagen subida a nuestro servidor, le agregamos la URL del backend
  if (imagen_url.startsWith('/uploads')) {
    // Usamos la variable de entorno si existe, o localhost por defecto
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    // Limpiamos la URL para que no quede duplicado el /api
    const baseUrl = apiUrl.replace('/api', ''); 
    return `${baseUrl}${imagen_url}`;
  }
  
  return imagen_url;
}