import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const healthCheck = async () => (await api.get('/health')).data;

export const predict = async (query, history = []) => {
  const response = await api.post('/predict', { query, history });
  return response.data;
};

export const uploadFiles = async (files) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const listFiles = async () => (await api.get('/files')).data;

export const deleteFile = async (filename) => (await api.delete('/files', { data: { filename } })).data;

export const wipeCollection = async () => (await api.delete('/wipe')).data;

export default api;
