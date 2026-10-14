import api from './api';

export const getSales        = (params) => api.get('/sales', { params });
export const getSaleById     = (id)     => api.get(`/sales/${id}`);
export const createSale      = (data)   => api.post('/sales', data);
export const updateSaleStatus = (id, data) => api.patch(`/sales/${id}/status`, data);
