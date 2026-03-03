import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://barberflow-back-end-19nv.onrender.com/api';

const clientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

clientApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ✅ Chave corrigida — sem @ ou : (inválidos no SecureStore)
    const token = await SecureStore.getItemAsync('barberFlow_client_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 [CLIENT-API]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url    = error.config?.url;
    const msg    = error.response?.data?.message || error.message || 'Erro desconhecido';
    console.error('❌ [CLIENT-API] Erro:', status, url, msg);

    if (status === 401) {
      // ✅ Chaves corrigidas
      await SecureStore.deleteItemAsync('barberFlow_client_token');
      await SecureStore.deleteItemAsync('barberFlow_client_user');
    }

    return Promise.reject(error);
  }
);

export default clientApi;