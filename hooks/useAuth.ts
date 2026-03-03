import { useAuthStore } from '@/stores/authStore';

/**
 * Hook centralizado de autenticação
 * Expõe dados e ações dos 3 perfis: barbeiro, cliente, admin
 */
export function useAuth() {
  const {
    barberUser, barbershop, barberLoading,
    clientUser, clientLoading,
    barberSignIn, barberSignUp, barberSignOut, loadBarberSession,
    clientSignIn, clientSignUp, clientSignOut, loadClientSession,
  } = useAuthStore();

  const isBarberAuthenticated = !!barberUser;
  const isClientAuthenticated = !!clientUser;
  const isAdmin               = !!barberUser?.isSuperAdmin;
  const isLoading             = barberLoading || clientLoading;

  return {
    // Estado
    barberUser,
    barbershop,
    clientUser,
    isBarberAuthenticated,
    isClientAuthenticated,
    isAdmin,
    isLoading,
    barberLoading,
    clientLoading,

    // Actions barbeiro
    barberSignIn,
    barberSignUp,
    barberSignOut,
    loadBarberSession,

    // Actions cliente
    clientSignIn,
    clientSignUp,
    clientSignOut,
    loadClientSession,
  };
}