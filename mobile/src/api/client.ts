import axios from "axios";
import { Platform } from "react-native";
import type {
  AuthResponse,
  Favorite,
  GenerateMenuRequest,
  Meal,
  MenuHistoryDetail,
  MenuHistorySummary,
  MenuResponse,
  Profile,
  ProfilePreferences,
  RegenerateMealRequest,
} from "../types/menu";

/**
 * Endereço do backend. Em desenvolvimento:
 * - Android emulator usa 10.0.2.2 para apontar para o "localhost" da máquina host.
 * - iOS simulator e web usam localhost diretamente.
 * - Em um device físico, troque pelo IP da sua máquina na rede local (ex: http://192.168.0.10:3333).
 *
 * Em produção (build web servido pelo próprio backend, ver render-build.sh):
 * o build é gerado com `EXPO_PUBLIC_API_URL=""`. Como string vazia não é
 * "nullish", o `??` abaixo NÃO cai no DEV_BASE_URL — API_BASE_URL vira "" e
 * o axios passa a montar todas as chamadas como caminhos relativos
 * (ex: "/api/menu/generate"), resolvidos pelo navegador contra a própria
 * origem da página. Ou seja: mesmo domínio/porta do backend, sem CORS e sem
 * precisar saber a URL de produção em tempo de build.
 */
const DEV_BASE_URL = Platform.select({
  android: "http://10.0.2.2:3333",
  default: "http://localhost:3333",
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEV_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000, // geração de cardápio via IA pode levar alguns segundos
});

/** Token atual, injetado pelo AuthContext assim que o usuário loga / abre o app. */
let currentToken: string | null = null;
export function setAuthToken(token: string | null) {
  currentToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

/**
 * Tenta extrair a mensagem amigável que o backend devolve no corpo do erro
 * (ex: "Falha ao gerar cardápio com a IA: ..."), em vez do texto genérico
 * do axios (ex: "Request failed with status code 502").
 */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o endereço configurado (EXPO_PUBLIC_API_URL) está correto.";
    }
    const body = err.response.data as
      | { error?: string; message?: string }
      | undefined;
    if (body?.message) return body.message;
    if (body?.error) return body.error;
    return err.message;
  }
  return err instanceof Error ? err.message : "Erro desconhecido.";
}

async function request<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    const { data } = await fn();
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/* ---------------------------------- Auth --------------------------------- */

export function register(email: string, password: string): Promise<AuthResponse> {
  return request(() => apiClient.post("/api/auth/register", { email, password }));
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request(() => apiClient.post("/api/auth/login", { email, password }));
}

/* -------------------------------- Profiles -------------------------------- */

export async function listProfiles(): Promise<Profile[]> {
  const { profiles } = await request<{ profiles: Profile[] }>(() =>
    apiClient.get("/api/profiles")
  );
  return profiles;
}

export async function createProfile(
  data: ProfilePreferences & { isPrimary?: boolean }
): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>(() =>
    apiClient.post("/api/profiles", data)
  );
  return profile;
}

export async function updateProfile(
  id: string,
  data: Partial<ProfilePreferences>
): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>(() =>
    apiClient.put(`/api/profiles/${id}`, data)
  );
  return profile;
}

export function deleteProfile(id: string): Promise<void> {
  return request(() => apiClient.delete(`/api/profiles/${id}`));
}

/* ---------------------------------- Menu ---------------------------------- */

export function generateMenu(
  req: GenerateMenuRequest
): Promise<{ menu: MenuResponse; historyId: string }> {
  return request(() => apiClient.post("/api/menu/generate", req));
}

export function regenerateMeal(
  req: RegenerateMealRequest
): Promise<{ meal: Meal; menu: MenuResponse }> {
  return request(() => apiClient.post("/api/menu/regenerate-meal", req));
}

export async function listMenuHistory(): Promise<MenuHistorySummary[]> {
  const { history } = await request<{ history: MenuHistorySummary[] }>(() =>
    apiClient.get("/api/menu/history")
  );
  return history;
}

export async function getMenuHistoryDetail(id: string): Promise<MenuHistoryDetail> {
  const { history } = await request<{ history: MenuHistoryDetail }>(() =>
    apiClient.get(`/api/menu/history/${id}`)
  );
  return history;
}

/* -------------------------------- Favorites -------------------------------- */

export async function listFavorites(): Promise<Favorite[]> {
  const { favorites } = await request<{ favorites: Favorite[] }>(() =>
    apiClient.get("/api/favorites")
  );
  return favorites;
}

export async function addFavorite(meal: Meal): Promise<Favorite> {
  const { favorite } = await request<{ favorite: Favorite }>(() =>
    apiClient.post("/api/favorites", { meal })
  );
  return favorite;
}

export function removeFavorite(id: string): Promise<void> {
  return request(() => apiClient.delete(`/api/favorites/${id}`));
}
