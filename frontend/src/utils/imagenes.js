const FALLBACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect width="160" height="100" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-family="sans-serif" font-size="13">Sin imagen</text></svg>'
  );

/**
 * Devuelve la URL completa de una imagen.
 * Si la imagen es una ruta local del backend (/uploads/...), le agrega el origen del backend.
 */
export function obtenerUrlImagen(imagen_url) {
  if (!imagen_url) return FALLBACK_SVG;

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

  return FALLBACK_SVG;
}