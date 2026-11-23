import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Role, SessionUser } from '../types';

type LoginInput = { email: string; password: string };

type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeForRole(role: Role) {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'TEACHER':
      return '/professor';
    case 'STUDENT':
      return '/aluno';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await api.get<{ data: { user: SessionUser } }>(
        '/auth/me',
      );
      return response.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await api.post<{ data: { user: SessionUser } }>(
        '/auth/login',
        input,
      );
      return response.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post<{ message: string }>('/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'session',
      });
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data ?? null,
      isLoading: sessionQuery.isLoading,
      isLoggingIn: loginMutation.isPending,
      login: loginMutation.mutateAsync,
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [
      sessionQuery.data,
      sessionQuery.isLoading,
      loginMutation.isPending,
      loginMutation.mutateAsync,
      logoutMutation.mutateAsync,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
