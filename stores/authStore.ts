import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '@/lib/api';
import clientApi from '@/lib/client-api';

// ─── Types (espelho do AuthContext.tsx e ClientAuthContext.tsx do web) ────────

export interface BarberUser {
  id: string;
  name: string;
  email: string;
  role: string;
  barbershopId: string | null;
  avatar?: string;
  isSuperAdmin?: boolean;
}

export interface Barbershop {
  id: string;
  name: string;
  plan: string;
  logo?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AuthState {
  // Barbeiro / Admin
  barberUser:  BarberUser | null;
  barbershop:  Barbershop | null;
  barberLoading: boolean;

  // Cliente
  clientUser:  ClientUser | null;
  clientLoading: boolean;

  // Actions — Barbeiro
  barberSignIn:  (email: string, password: string) => Promise<void>;
  barberSignUp:  (data: BarberSignUpData) => Promise<void>;
  barberSignOut: () => Promise<void>;
  loadBarberSession: () => Promise<void>;

  // Actions — Cliente
  clientSignIn:  (email: string, password: string) => Promise<void>;
  clientSignUp:  (data: ClientSignUpData) => Promise<void>;
  clientSignOut: () => Promise<void>;
  loadClientSession: () => Promise<void>;
}

export interface BarberSignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  barbershopName: string;
  barbershopPhone: string;
}

export interface ClientSignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  barberUser:    null,
  barbershop:    null,
  barberLoading: true,
  clientUser:    null,
  clientLoading: true,

  // ── Carregar sessão do Barbeiro ao abrir o app ──────────────────────────────
  loadBarberSession: async () => {
    try {
      const token   = await SecureStore.getItemAsync('@barberFlow:token');
      const userStr = await SecureStore.getItemAsync('@barberFlow:user');
      const shopStr = await SecureStore.getItemAsync('@barberFlow:barbershop');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const shop = shopStr ? JSON.parse(shopStr) : null;
        set({ barberUser: user, barbershop: shop });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ [Auth] Barbeiro restaurado:', user.email);
      }
    } catch (e) {
      console.error('❌ [Auth] Erro ao restaurar sessão barbeiro:', e);
    } finally {
      set({ barberLoading: false });
    }
  },

  // ── Carregar sessão do Cliente ao abrir o app ───────────────────────────────
  loadClientSession: async () => {
    try {
      const token   = await SecureStore.getItemAsync('@barberFlow:client:token');
      const userStr = await SecureStore.getItemAsync('@barberFlow:client:user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ clientUser: user });
        console.log('✅ [Auth] Cliente restaurado:', user.email);
      }
    } catch (e) {
      console.error('❌ [Auth] Erro ao restaurar sessão cliente:', e);
    } finally {
      set({ clientLoading: false });
    }
  },

  // ── Login Barbeiro ──────────────────────────────────────────────────────────
  barberSignIn: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user, barbershop } = response.data;

    await SecureStore.setItemAsync('@barberFlow:token',      token);
    await SecureStore.setItemAsync('@barberFlow:user',       JSON.stringify(user));
    if (barbershop) {
      await SecureStore.setItemAsync('@barberFlow:barbershop', JSON.stringify(barbershop));
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ barberUser: user, barbershop: barbershop || null });
    console.log('✅ [Auth] Barbeiro logado:', user.email);
  },

  // ── Cadastro Barbeiro ───────────────────────────────────────────────────────
  barberSignUp: async (data) => {
    const response = await api.post('/auth/register', data);
    const { token, user, barbershop } = response.data;

    await SecureStore.setItemAsync('@barberFlow:token',      token);
    await SecureStore.setItemAsync('@barberFlow:user',       JSON.stringify(user));
    await SecureStore.setItemAsync('@barberFlow:barbershop', JSON.stringify(barbershop));

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ barberUser: user, barbershop });
  },

  // ── Logout Barbeiro ─────────────────────────────────────────────────────────
  barberSignOut: async () => {
    await SecureStore.deleteItemAsync('@barberFlow:token');
    await SecureStore.deleteItemAsync('@barberFlow:user');
    await SecureStore.deleteItemAsync('@barberFlow:barbershop');
    delete api.defaults.headers.common['Authorization'];
    set({ barberUser: null, barbershop: null });
    console.log('👋 [Auth] Barbeiro deslogado');
  },

  // ── Login Cliente ───────────────────────────────────────────────────────────
  clientSignIn: async (email, password) => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://barberflow-back-end-19nv.onrender.com/api';
    const response = await fetch(`${API_URL}/client/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    const { token, client } = await response.json();

    await SecureStore.setItemAsync('@barberFlow:client:token', token);
    await SecureStore.setItemAsync('@barberFlow:client:user',  JSON.stringify(client));

    set({ clientUser: client });
    console.log('✅ [Auth] Cliente logado:', client.email);
  },

  // ── Cadastro Cliente ────────────────────────────────────────────────────────
  clientSignUp: async (data) => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://barberflow-back-end-19nv.onrender.com/api';
    const response = await fetch(`${API_URL}/client/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar conta');
    }

    const { token, client } = await response.json();

    await SecureStore.setItemAsync('@barberFlow:client:token', token);
    await SecureStore.setItemAsync('@barberFlow:client:user',  JSON.stringify(client));

    set({ clientUser: client });
  },

  // ── Logout Cliente ──────────────────────────────────────────────────────────
  clientSignOut: async () => {
    await SecureStore.deleteItemAsync('@barberFlow:client:token');
    await SecureStore.deleteItemAsync('@barberFlow:client:user');
    set({ clientUser: null });
    console.log('👋 [Auth] Cliente deslogado');
  },
}));