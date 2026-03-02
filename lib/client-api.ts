import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Equivalente ao client-api.ts do web
// Web usa: sessionStorage (token do CLIENTE)
// App usa: SecureStore com chave separada '@barberFlow:client:token'

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
    const token = await SecureStore.getItemAsync('@barberFlow:client:token');
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
    console.error('❌ [CLIENT-API] Erro:', error.response?.status, error.config?.url);

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('@barberFlow:client:token');
      await SecureStore.deleteItemAsync('@barberFlow:client:user');
    }

    return Promise.reject(error);
  }
);

export default clientApi;