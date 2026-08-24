export type Goal =
  | "emagrecer"
  | "manter_peso"
  | "ganhar_massa"
  | "comer_mais_saudavel";

export type MealType = "cafe_da_manha" | "almoco" | "lanche" | "jantar";

/** Campos de preferência nutricional (compartilhados entre onboarding e edição de perfil). */
export interface ProfilePreferences {
  name: string;
  goal: Goal;
  restrictions: string[];
  allergies: string[];
  dislikedFoods: string[];
  householdSize: number;
  dailyCalorieTarget?: number;
  weeklyBudgetBRL?: number;
}

/** Um perfil salvo no backend — representa uma pessoa da casa. */
export interface Profile extends ProfilePreferences {
  id: string;
  userId: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Meal {
  type: MealType;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  estimatedCostBRL: number;
  prepTimeMinutes: number;
  usesPantryItems: string[];
}

export interface DayPlan {
  dayLabel: string;
  meals: Meal[];
}

export interface MenuResponse {
  summary: string;
  days: DayPlan[];
  estimatedWeeklyCostBRL: number;
  avgDailyCalories: number;
  shoppingList: Ingredient[];
  notes: string[];
}

export interface GenerateMenuRequest {
  profileId: string;
  pantryItems: string[];
  daysRequested: number;
  notes?: string;
}

export interface RegenerateMealRequest {
  historyId: string;
  dayLabel: string;
  mealType: MealType;
  notes?: string;
}

export interface MenuHistorySummary {
  id: string;
  createdAt: string;
  profileId: string;
  profileName: string;
  summary: string;
  estimatedWeeklyCostBRL: number;
  avgDailyCalories: number;
}

export interface MenuHistoryDetail {
  id: string;
  createdAt: string;
  profileId: string;
  profileName: string;
  response: MenuResponse;
}

export interface Favorite {
  id: string;
  meal: Meal;
  createdAt: string;
}

/* ---------------------------------- Auth --------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const GOAL_LABELS: Record<Goal, string> = {
  emagrecer: "Emagrecer",
  manter_peso: "Manter o peso",
  ganhar_massa: "Ganhar massa muscular",
  comer_mais_saudavel: "Comer de forma mais saudável",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
};
