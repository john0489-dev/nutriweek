import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../api/client";
import * as api from "../api/client";
import type { AuthUser } from "../types/menu";

const TOKEN_KEY = "@nutriweek/auth_token";
const USER_KEY = "@nutriweek/auth_user";

interface AuthContextValue {
  isLoadingAuth: boolean;
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  authError: string | null;
  isSubmitting: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
        }
      } catch (err) {
        console.warn("Falha ao carregar sessão salva:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        const res = await api.login(email, password);
        await persistSession(res.token, res.user);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Erro ao entrar.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        const res = await api.register(email, password);
        await persistSession(res.token, res.user);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Erro ao criar conta.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoadingAuth,
      token,
      user,
      isAuthenticated: !!token,
      authError,
      isSubmitting,
      login,
      register,
      logout,
      clearAuthError,
    }),
    [isLoadingAuth, token, user, authError, isSubmitting, login, register, logout, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
