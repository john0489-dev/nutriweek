import axios from "axios";
import { Platform } from "react-native";
import type { MenuRequest, MenuResponse } from "../types/menu";

/**
 * Endereço do backend. Em desenvolvimento:
 * - Android emulator usa 10.0.2.2 para apontar para o "localhost" da máquina host.
 * - iOS simulator e web usam localhost diretamente.
 * - Em um device físico, troque pelo IP da sua máquina na rede local (ex: http://192.168.0.10:3333).
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

export async function generateMenu(
  request: MenuRequest
): Promise<MenuResponse> {
  const { data } = await apiClient.post<MenuResponse>(
    "/api/menu/generate",
    request
  );
  return data;
}
