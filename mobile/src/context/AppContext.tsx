import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as api from "../api/client";
import { useAuth } from "./AuthContext";
import type {
  Favorite,
  Meal,
  MealType,
  MenuHistoryDetail,
  MenuHistorySummary,
  MenuResponse,
  Profile,
  ProfilePreferences,
} from "../types/menu";

const STORAGE_KEYS = {
  pantry: "@nutriweek/pantry",
  activeProfileId: "@nutriweek/active_profile_id",
};

interface AppContextValue {
  // perfis
  isLoadingProfiles: boolean;
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | undefined;
  setActiveProfileId: (id: string) => void;
  refreshProfiles: () => Promise<void>;
  createProfile: (data: ProfilePreferences) => Promise<Profile>;
  editProfile: (id: string, data: Partial<ProfilePreferences>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;

  // despensa (local ao device, não sincroniza com backend)
  pantryItems: string[];
  addPantryItem: (item: string) => void;
  removePantryItem: (item: string) => void;

  // cardápio
  menu: MenuResponse | null;
  historyId: string | null;
  isGeneratingMenu: boolean;
  menuError: string | null;
  regenerateMenu: (extraNotes?: string) => Promise<void>;
  regenerateOneMeal: (
    dayLabel: string,
    mealType: MealType,
    notes?: string
  ) => Promise<void>;
  isRegeneratingMeal: boolean;

  // histórico
  history: MenuHistorySummary[];
  isLoadingHistory: boolean;
  refreshHistory: () => Promise<void>;
  loadHistoryDetail: (id: string) => Promise<MenuHistoryDetail>;

  // favoritos
  favorites: Favorite[];
  isLoadingFavorites: boolean;
  refreshFavorites: () => Promise<void>;
  isMealFavorited: (meal: Meal) => boolean;
  toggleFavorite: (meal: Meal) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);

  const [pantryItems, setPantryItems] = useState<string[]>([]);

  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [isRegeneratingMeal, setIsRegeneratingMeal] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [history, setHistory] = useState<MenuHistorySummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Carrega despensa e perfil ativo salvos localmente.
  useEffect(() => {
    (async () => {
      const [storedPantry, storedActiveId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.pantry),
        AsyncStorage.getItem(STORAGE_KEYS.activeProfileId),
      ]);
      if (storedPantry) setPantryItems(JSON.parse(storedPantry));
      if (storedActiveId) setActiveProfileIdState(storedActiveId);
    })();
  }, []);

  const refreshProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const list = await api.listProfiles();
      setProfiles(list);
      setActiveProfileIdState((current) => {
        if (current && list.some((p) => p.id === current)) return current;
        const primary = list.find((p) => p.isPrimary) ?? list[0];
        if (primary) {
          AsyncStorage.setItem(STORAGE_KEYS.activeProfileId, primary.id).catch(() => undefined);
          return primary.id;
        }
        return null;
      });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      setHistory(await api.listMenuHistory());
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      setFavorites(await api.listFavorites());
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  // Ao autenticar, carrega tudo que depende do backend. Ao deslogar, limpa.
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfiles().catch(() => undefined);
      refreshHistory().catch(() => undefined);
      refreshFavorites().catch(() => undefined);
    } else {
      setProfiles([]);
      setActiveProfileIdState(null);
      setMenu(null);
      setHistoryId(null);
      setHistory([]);
      setFavorites([]);
    }
  }, [isAuthenticated, refreshProfiles, refreshHistory, refreshFavorites]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    setMenu(null);
    setHistoryId(null);
    AsyncStorage.setItem(STORAGE_KEYS.activeProfileId, id).catch(() => undefined);
  }, []);

  const createProfile = useCallback(
    async (data: ProfilePreferences) => {
      const profile = await api.createProfile(data);
      setProfiles((prev) => [...prev, profile]);
      setActiveProfileId(profile.id);
      return profile;
    },
    [setActiveProfileId]
  );

  const editProfile = useCallback(
    async (id: string, data: Partial<ProfilePreferences>) => {
      const updated = await api.updateProfile(id, data);
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    []
  );

  const removeProfile = useCallback(
    async (id: string) => {
      await api.deleteProfile(id);
      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (activeProfileId === id && next.length) {
          setActiveProfileId(next[0].id);
        }
        return next;
      });
    },
    [activeProfileId, setActiveProfileId]
  );

  const addPantryItem = useCallback((item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setPantryItems((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      AsyncStorage.setItem(STORAGE_KEYS.pantry, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const removePantryItem = useCallback((item: string) => {
    setPantryItems((prev) => {
      const next = prev.filter((i) => i !== item);
      AsyncStorage.setItem(STORAGE_KEYS.pantry, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const regenerateMenu = useCallback(
    async (extraNotes?: string) => {
      if (!activeProfileId) {
        setMenuError("Crie ou selecione um perfil antes de gerar um cardápio.");
        return;
      }
      setIsGeneratingMenu(true);
      setMenuError(null);
      try {
        const result = await api.generateMenu({
          profileId: activeProfileId,
          pantryItems,
          daysRequested: 7,
          notes: extraNotes,
        });
        setMenu(result.menu);
        setHistoryId(result.historyId);
        refreshHistory().catch(() => undefined);
      } catch (err) {
        setMenuError(err instanceof Error ? err.message : "Erro desconhecido ao gerar o cardápio.");
      } finally {
        setIsGeneratingMenu(false);
      }
    },
    [activeProfileId, pantryItems, refreshHistory]
  );

  const regenerateOneMeal = useCallback(
    async (dayLabel: string, mealType: MealType, notes?: string) => {
      if (!historyId) {
        setMenuError("Gere o cardápio da semana antes de trocar uma refeição.");
        return;
      }
      setIsRegeneratingMeal(true);
      setMenuError(null);
      try {
        const result = await api.regenerateMeal({ historyId, dayLabel, mealType, notes });
        setMenu(result.menu);
      } catch (err) {
        setMenuError(err instanceof Error ? err.message : "Erro ao regenerar a refeição.");
        throw err;
      } finally {
        setIsRegeneratingMeal(false);
      }
    },
    [historyId]
  );

  const loadHistoryDetail = useCallback(async (id: string) => {
    return api.getMenuHistoryDetail(id);
  }, []);

  const isMealFavorited = useCallback(
    (meal: Meal) => favorites.some((f) => f.meal.name === meal.name && f.meal.type === meal.type),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (meal: Meal) => {
      const existing = favorites.find(
        (f) => f.meal.name === meal.name && f.meal.type === meal.type
      );
      if (existing) {
        await api.removeFavorite(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const favorite = await api.addFavorite(meal);
        setFavorites((prev) => [favorite, ...prev]);
      }
    },
    [favorites]
  );

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId),
    [profiles, activeProfileId]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isLoadingProfiles,
      profiles,
      activeProfileId,
      activeProfile,
      setActiveProfileId,
      refreshProfiles,
      createProfile,
      editProfile,
      removeProfile,
      pantryItems,
      addPantryItem,
      removePantryItem,
      menu,
      historyId,
      isGeneratingMenu,
      menuError,
      regenerateMenu,
      regenerateOneMeal,
      isRegeneratingMeal,
      history,
      isLoadingHistory,
      refreshHistory,
      loadHistoryDetail,
      favorites,
      isLoadingFavorites,
      refreshFavorites,
      isMealFavorited,
      toggleFavorite,
    }),
    [
      isLoadingProfiles,
      profiles,
      activeProfileId,
      activeProfile,
      setActiveProfileId,
      refreshProfiles,
      createProfile,
      editProfile,
      removeProfile,
      pantryItems,
      addPantryItem,
      removePantryItem,
      menu,
      historyId,
      isGeneratingMenu,
      menuError,
      regenerateMenu,
      regenerateOneMeal,
      isRegeneratingMeal,
      history,
      isLoadingHistory,
      refreshHistory,
      loadHistoryDetail,
      favorites,
      isLoadingFavorites,
      refreshFavorites,
      isMealFavorited,
      toggleFavorite,
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
