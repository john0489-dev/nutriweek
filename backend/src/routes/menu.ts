import { Router } from "express";
import { db } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../auth";
import {
  GenerateMenuRequestSchema,
  RegenerateMealRequestSchema,
} from "../types/domain";
import { generateMenu, regenerateSingleMeal } from "../services/menuGenerator";
import type { UserProfile } from "../types/menu";

export const menuRouter = Router();

menuRouter.use(requireAuth);

function toUserProfile(profile: {
  goal: UserProfile["goal"];
  restrictions: string[];
  allergies: string[];
  dislikedFoods: string[];
  householdSize: number;
  dailyCalorieTarget?: number;
  weeklyBudgetBRL?: number;
}): UserProfile {
  return {
    goal: profile.goal,
    restrictions: profile.restrictions,
    allergies: profile.allergies,
    dislikedFoods: profile.dislikedFoods,
    householdSize: profile.householdSize,
    dailyCalorieTarget: profile.dailyCalorieTarget,
    weeklyBudgetBRL: profile.weeklyBudgetBRL,
  };
}

/**
 * POST /api/menu/generate
 * Gera um cardápio semanal para um perfil salvo do usuário e guarda no histórico.
 */
menuRouter.post("/generate", async (req: AuthenticatedRequest, res) => {
  const parsed = GenerateMenuRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Requisição inválida", details: parsed.error.flatten() });
  }

  const { profileId, pantryItems, daysRequested, notes } = parsed.data;
  const profile = await db.findProfile(req.userId!, profileId);
  if (!profile) {
    return res.status(404).json({ error: "Perfil não encontrado" });
  }

  try {
    const menu = await generateMenu({
      profile: toUserProfile(profile),
      pantryItems,
      daysRequested,
      notes,
    });
    const history = await db.addMenuHistory({
      userId: req.userId!,
      profileId: profile.id,
      profileName: profile.name,
      response: menu,
    });
    return res.json({ menu, historyId: history.id });
  } catch (err) {
    console.error("[menu.generate] erro:", err);
    return res.status(502).json({
      error: "Falha ao gerar cardápio com a IA",
      message: (err as Error).message,
    });
  }
});

/**
 * POST /api/menu/regenerate-meal
 * Troca só uma refeição de um cardápio já salvo no histórico, mantendo o resto.
 */
menuRouter.post("/regenerate-meal", async (req: AuthenticatedRequest, res) => {
  const parsed = RegenerateMealRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Requisição inválida", details: parsed.error.flatten() });
  }
  const { historyId, dayLabel, mealType, notes } = parsed.data;

  const history = await db.findMenuHistory(req.userId!, historyId);
  if (!history) {
    return res.status(404).json({ error: "Cardápio não encontrado no histórico" });
  }
  const profile = await db.findProfile(req.userId!, history.profileId);
  if (!profile) {
    return res.status(404).json({ error: "Perfil do cardápio não encontrado" });
  }
  const day = history.response.days.find((d) => d.dayLabel === dayLabel);
  if (!day) {
    return res.status(404).json({ error: "Dia não encontrado nesse cardápio" });
  }

  const otherMealNames = history.response.days.flatMap((d) =>
    d.meals.filter((m) => !(d.dayLabel === dayLabel && m.type === mealType)).map((m) => m.name)
  );

  try {
    const newMeal = await regenerateSingleMeal({
      profile: toUserProfile(profile),
      pantryItems: [],
      dayLabel,
      mealType,
      otherMealNames,
      notes,
    });

    const updatedResponse = {
      ...history.response,
      days: history.response.days.map((d) =>
        d.dayLabel === dayLabel
          ? {
              ...d,
              meals: d.meals.map((m) => (m.type === mealType ? newMeal : m)),
            }
          : d
      ),
    };

    const saved = await db.updateMenuHistory(req.userId!, historyId, updatedResponse);
    return res.json({ meal: newMeal, menu: saved?.response });
  } catch (err) {
    console.error("[menu.regenerate-meal] erro:", err);
    return res.status(502).json({
      error: "Falha ao regenerar a refeição com a IA",
      message: (err as Error).message,
    });
  }
});

/** GET /api/menu/history — lista resumida dos cardápios já gerados. */
menuRouter.get("/history", async (req: AuthenticatedRequest, res) => {
  const history = (await db.listMenuHistory(req.userId!)).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    profileId: h.profileId,
    profileName: h.profileName,
    summary: h.response.summary,
    estimatedWeeklyCostBRL: h.response.estimatedWeeklyCostBRL,
    avgDailyCalories: h.response.avgDailyCalories,
  }));
  return res.json({ history });
});

/** GET /api/menu/history/:id — detalhe completo de um cardápio gerado antes. */
menuRouter.get("/history/:id", async (req: AuthenticatedRequest, res) => {
  const history = await db.findMenuHistory(req.userId!, req.params.id);
  if (!history) {
    return res.status(404).json({ error: "Cardápio não encontrado" });
  }
  return res.json({ history });
});
