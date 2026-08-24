import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateMenu as callGenerateMenu } from "../api/client";
import type { MenuResponse, UserProfile } from "../types/menu";

const STORAGE_KEYS = {
  profile: "@nutriweek/profile",
  pantry: "@nutriweek/pantry",
  menu: "@nutriweek/menu",
};

interface AppContextValue {
  isLoadingStorage: boolean;

  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => Promise<void>;

  pantryItems: string[];
  addPantryItem: (item: string) => void;
  removePantryItem: (item: string) => void;

  menu: MenuResponse | null;
  isGeneratingMenu: boolean;
  menuError: string | null;
  regenerateMenu: (extraNotes?: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Carrega estado persistido ao abrir o app.
  useEffect(() => {
    (async () => {
      try {
        const [storedProfile, storedPantry, storedMenu] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.pantry),
          AsyncStorage.getItem(STORAGE_KEYS.menu),
        ]);
        if (storedProfile) setProfile(JSON.parse(storedProfile));
        if (storedPantry) setPantryItems(JSON.parse(storedPantry));
        if (storedMenu) setMenu(JSON.parse(storedMenu));
      } catch (err) {
        console.warn("Falha ao carregar dados salvos:", err);
      } finally {
        setIsLoadingStorage(false);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await AsyncStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify(newProfile)
    );
  }, []);

  const addPantryItem = useCallback((item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setPantryItems((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      AsyncStorage.setItem(STORAGE_KEYS.pantry, JSON.stringify(next)).catch(
        () => undefined
      );
      return next;
    });
  }, []);

  const removePantryItem = useCallback((item: string) => {
    setPantryItems((prev) => {
      const next = prev.filter((i) => i !== item);
      AsyncStorage.setItem(STORAGE_KEYS.pantry, JSON.stringify(next)).catch(
        () => undefined
      );
      return next;
    });
  }, []);

  const regenerateMenu = useCallback(
    async (extraNotes?: string) => {
      if (!profile) {
        setMenuError("Complete seu perfil antes de gerar um cardápio.");
        return;
      }
      setIsGeneratingMenu(true);
      setMenuError(null);
      try {
        const result = await callGenerateMenu({
          profile,
          pantryItems,
          daysRequested: 7,
          notes: extraNotes,
        });
        setMenu(result);
        await AsyncStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(result));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido ao gerar o cardápio.";
        setMenuError(message);
      } finally {
        setIsGeneratingMenu(false);
      }
    },
    [profile, pantryItems]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isLoadingStorage,
      profile,
      saveProfile,
      pantryItems,
      addPantryItem,
      removePantryItem,
      menu,
      isGeneratingMenu,
      menuError,
      regenerateMenu,
    }),
    [
      isLoadingStorage,
      profile,
      saveProfile,
      pantryItems,
      addPantryItem,
      removePantryItem,
      menu,
      isGeneratingMenu,
      menuError,
      regenerateMenu,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext deve ser usado dentro de um AppProvider");
  }
  return ctx;
}
