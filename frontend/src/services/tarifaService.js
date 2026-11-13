import api from './api';

export const tarifaService = {
  listar: async () => {
    const response = await api.get('/tarifas');
    return response.data;
  },

  crear: async (tarifaData) => {
    const response = await api.post('/tarifas', tarifaData);
    return response.data;
  },

  calcular: async (vehiculoId, modalidad, horas) => {
    const response = await api.get(`/tarifas/calcular/${vehiculoId}?modalidad=${modalidad}&horas=${horas}`);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/tarifas/${id}`);
    return response.data;
  }
};