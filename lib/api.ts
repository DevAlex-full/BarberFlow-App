import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Mesma lógica do web, adaptada para RN
// Web usa: localStorage / sessionStorage
// App usa: expo-secure-store (criptografado no dispositivo)

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://barberflow-back-end-19nv.onrender.com/api';

console.log('🌐 [APP] API URL:', API_BASE_URL);

// ─── Instância principal (Barbeiro / Admin) ──────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // SecureStore é async no RN — equivalente ao localStorage.getItem do web
    const token = await SecureStore.getItemAsync('@barberFlow:token');
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
    console.error('❌ [API] Erro:', error.response?.status, error.config?.url);

    if (error.response?.status === 401) {
      // Limpa tokens — equivalente ao localStorage.removeItem do web
      await SecureStore.deleteItemAsync('@barberFlow:token');
      await SecureStore.deleteItemAsync('@barberFlow:user');
      await SecureStore.deleteItemAsync('@barberFlow:barbershop');
    }

    return Promise.reject(error);
  }
);

export default api;