import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://barberflow-back-end-19nv.onrender.com/api';

console.log('🌐 [APP] API URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ✅ Chave corrigida — sem @ ou : (inválidos no SecureStore)
    const token = await SecureStore.getItemAsync('barberFlow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 [API]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url    = error.config?.url;
    const msg    = error.response?.data?.message || error.message || 'Erro desconhecido';
    console.error('❌ [API] Erro:', status, url, msg);

    if (status === 401) {
      // ✅ Chaves corrigidas
      await SecureStore.deleteItemAsync('barberFlow_token');
      await SecureStore.deleteItemAsync('barberFlow_user');
      await SecureStore.deleteItemAsync('barberFlow_barbershop');
    }

    return Promise.reject(error);
  }
);

export default api;