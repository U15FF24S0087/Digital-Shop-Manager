import api from './api';

export const getPurchases         = (params) => api.get('/purchases', { params });
export const getPurchaseById      = (id)     => api.get(`/purchases/${id}`);
export const createPurchase       = (data)   => api.post('/purchases', data);
export const updatePurchaseStatus = (id, data) => api.patch(`/purchases/${id}/status`, data);
