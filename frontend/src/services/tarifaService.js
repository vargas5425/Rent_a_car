import api from './api'; // Tu archivo axios configurado

export const tarifaService = {
  // Obtener todas las tarifas para la tabla del Admin
  listar: async () => {
    const response = await api.get('/tarifas');
    return response.data;
  },

  

  // Crear una nueva tarifa
  crear: async (tarifaData) => {
    const response = await api.post('/tarifas', tarifaData);
    return response.data;
  },

  // Calcular precio (útil si el cliente quiere saber cuánto cuesta)
  calcular: async (vehiculoId, modalidad, horas) => {
    const response = await api.get(`/tarifas/calcular/${vehiculoId}?modalidad=${modalidad}&horas=${horas}`);
    return response.data;
  },
    eliminar: async (id) => {
    const response = await api.delete(`/tarifas/${id}`);
    return response.data;
  }
};p