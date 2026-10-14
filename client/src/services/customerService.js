import api from './api';

export const getCustomers          = (params) => api.get('/customers', { params });
export const getAllCustomers        = ()       => api.get('/customers/all');
export const getCustomerById       = (id)     => api.get(`/customers/${id}`);
export const createCustomer        = (data)   => api.post('/customers', data);
export const updateCustomer        = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer        = (id)     => api.delete(`/customers/${id}`);
export const getPurchaseHistory    = (id)     => api.get(`/customers/${id}/purchase-history`);
