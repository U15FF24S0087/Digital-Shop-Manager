import api from './api';

export const login           = (data)  => api.post('/auth/login', data);
export const register        = (data)  => api.post('/auth/register', data);
export const logout          = ()      => api.post('/auth/logout');
export const getProfile      = ()      => api.get('/auth/me');
export const updateProfile   = (data)  => api.patch('/auth/me', data);
export const changePassword  = (data)  => api.post('/auth/change-password', data);
export const refreshToken    = (token) => api.post('/auth/refresh-token', { refreshToken: token });
