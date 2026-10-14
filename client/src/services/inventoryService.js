import api from './api';

export const getStock             = (params)  => api.get('/inventory', { params });
export const getLowStock          = ()        => api.get('/inventory/low-stock');
export const getMovements         = (params)  => api.get('/inventory/movements', { params });
export const getProductMovements  = (id, params) => api.get(`/inventory/products/${id}/movements`, { params });
export const adjustStock          = (data)    => api.post('/inventory/adjust', data);
