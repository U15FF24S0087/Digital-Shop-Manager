import api from './api';

export const getSuppliers         = (params) => api.get('/suppliers', { params });
export const getAllSuppliers       = ()       => api.get('/suppliers/all');
export const getSupplierById      = (id)     => api.get(`/suppliers/${id}`);
export const createSupplier       = (data)   => api.post('/suppliers', data);
export const updateSupplier       = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier       = (id)     => api.delete(`/suppliers/${id}`);
export const getSupplierHistory   = (id)     => api.get(`/suppliers/${id}/purchase-history`);
