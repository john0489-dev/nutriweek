import { z } from "zod";
import { GoalSchema, MealSchema, MealTypeSchema, MenuResponseSchema } from "./menu";

/* ---------------------------------- Auth --------------------------------- */

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
}

/* -------------------------------- Profiles -------------------------------- */

/** Campos de preferência nutricional — um perfil pode ser você, seu cônjuge, etc. */
export const ProfilePreferencesSchema = z.object({
  goal: GoalSchema,
  restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  householdSize: z.number().int().min(1).max(20).default(1),
  dailyCalorieTarget: z.number().int().min(800).max(6000).optional(),
  weeklyBudgetBRL: z.number().min(0).optional(),
});
export type ProfilePreferences = z.infer<typeof ProfilePreferencesSchema>;

export const CreateProfileSchema = ProfilePreferencesSchema.extend({
  name: z.string().min(1).max(60),
  isPrimary: z.boolean().optional(),
});
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema.partial();
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export interface ProfileRecord extends ProfilePreferences {
  id: string;
  userId: string;
  name: string;
  isPrimary: boolean;
  createdAt: string;
}

/* ------------------------------- Menu history ------------------------------ */

export const GenerateMenuRequestSchema = z.object({
  profileId: z.string(),
  pantryItems: z.array(z.string()).default([]),
  daysRequested: z.number().int().min(1).max(14).default(7),
  notes: z.string().max(500).optional(),
});
export type GenerateMenuRequest = z.infer<typeof GenerateMenuRequestSchema>;

export const RegenerateMealRequestSchema = z.object({
  historyId: z.string(),
  dayLabel: z.string(),
  mealType: MealTypeSchema,
  notes: z.string().max(500).optional(),
});
export type RegenerateMealRequest = z.infer<typeof RegenerateMealRequestSchema>;

export interface MenuHistoryRecord {
  id: string;
  userId: string;
  profileId: string;
  profileName: string;
  createdAt: string;
  response: z.infer<typeof MenuResponseSchema>;
}

/* --------------------------------- Favorites -------------------------------- */

export const CreateFavoriteSchema = z.object({
  meal: MealSchema,
});
export type CreateFavoriteInput = z.infer<typeof CreateFavoriteSchema>;

export interface FavoriteRecord {
  id: string;
  userId: string;
  meal: z.infer<typeof MealSchema>;
  createdAt: string;
}
