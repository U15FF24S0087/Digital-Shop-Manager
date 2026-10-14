import api from './api';

export const getProducts       = (params) => api.get('/products', { params });
export const getProductStats   = () => api.get('/products/stats');
export const getProductById    = (id)     => api.get(`/products/${id}`);
export const createProduct     = (data)   => api.post('/products', data);
export const updateProduct     = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct     = (id)     => api.delete(`/products/${id}`);
export const getLowStockProducts = ()     => api.get('/products/low-stock');
