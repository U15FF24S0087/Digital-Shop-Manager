import api from './api';

export const getCategories    = (params) => api.get('/categories', { params });
export const getCategoryStats = ()       => api.get('/categories/stats');
export const getAllCategories  = ()       => api.get('/categories/all');
export const getCategoryById  = (id)     => api.get(`/categories/${id}`);
export const getCategoryProducts = (id, params) => api.get(`/categories/${id}/products`, { params });
export const createCategory   = (data)   => api.post('/categories', data);
export const updateCategory   = (id, data) => api.patch(`/categories/${id}`, data);
export const deleteCategory   = (id, reassignTo) => api.delete(`/categories/${id}`, {
  params: reassignTo ? { reassignTo } : undefined,
});
