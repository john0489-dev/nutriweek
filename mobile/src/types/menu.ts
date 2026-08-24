export type Goal =
  | "emagrecer"
  | "manter_peso"
  | "ganhar_massa"
  | "comer_mais_saudavel";

export type MealType = "cafe_da_manha" | "almoco" | "lanche" | "jantar";

export interface UserProfile {
  goal: Goal;
  restrictions: string[];
  allergies: string[];
  dislikedFoods: string[];
  householdSize: number;
  dailyCalorieTarget?: number;
  weeklyBudgetBRL?: number;
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

export interface MenuRequest {
  profile: UserProfile;
  pantryItems: string[];
  daysRequested: number;
  notes?: string;
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
