import { useAuthStore } from '../store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const isAuthenticated = !!user;
  const isProfileComplete = !!profile;

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isProfileComplete,
  };
}
