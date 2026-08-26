import { Router } from "express";
import { db } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../auth";
import { CreateFavoriteSchema } from "../types/domain";

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const favorites = await db.listFavorites(req.userId!);
  return res.json({ favorites });
});

favoritesRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const parsed = CreateFavoriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const favorite = await db.addFavorite(req.userId!, parsed.data.meal);
  return res.status(201).json({ favorite });
});

favoritesRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const deleted = await db.deleteFavorite(req.userId!, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Favorito não encontrado" });
  }
  return res.status(204).send();
});
