import api from './api';

export const getDashboard = (config) => api.get('/dashboard/summary', config);
