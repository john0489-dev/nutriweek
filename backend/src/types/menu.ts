import { z } from "zod";

/** Objetivo nutricional do usuário. */
export const GoalSchema = z.enum([
  "emagrecer",
  "manter_peso",
  "ganhar_massa",
  "comer_mais_saudavel",
]);
export type Goal = z.infer<typeof GoalSchema>;

export const MealTypeSchema = z.enum([
  "cafe_da_manha",
  "almoco",
  "lanche",
  "jantar",
]);
export type MealType = z.infer<typeof MealTypeSchema>;

/** Perfil do usuário, coletado no onboarding do app. */
export const UserProfileSchema = z.object({
  goal: GoalSchema,
  restrictions: z.array(z.string()).default([]), // ex: "vegetariano", "sem_gluten"
  allergies: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  householdSize: z.number().int().min(1).max(20).default(1),
  dailyCalorieTarget: z.number().int().min(800).max(6000).optional(),
  weeklyBudgetBRL: z.number().min(0).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

/** Requisição de geração/otimização de cardápio. */
export const MenuRequestSchema = z.object({
  profile: UserProfileSchema,
  pantryItems: z.array(z.string()).default([]),
  daysRequested: z.number().int().min(1).max(14).default(7),
  notes: z.string().max(500).optional(), // pedido livre do usuário, ex: "sem repetir frango"
});
export type MenuRequest = z.infer<typeof MenuRequestSchema>;

export const IngredientSchema = z.object({
  name: z.string(),
  quantity: z.string(), // texto livre, ex: "200 g", "2 unidades"
});

export const MealSchema = z.object({
  type: MealTypeSchema,
  name: z.string(),
  description: z.string(),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(z.string()),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  estimatedCostBRL: z.number(),
  prepTimeMinutes: z.number(),
  usesPantryItems: z.array(z.string()).default([]),
});
export type Meal = z.infer<typeof MealSchema>;

export const DayPlanSchema = z.object({
  dayLabel: z.string(), // ex: "Segunda-feira"
  meals: z.array(MealSchema),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

export const MenuResponseSchema = z.object({
  summary: z.string(),
  days: z.array(DayPlanSchema),
  estimatedWeeklyCostBRL: z.number(),
  avgDailyCalories: z.number(),
  shoppingList: z.array(IngredientSchema),
  notes: z.array(z.string()).default([]),
});
export type MenuResponse = z.infer<typeof MenuResponseSchema>;
