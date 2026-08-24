import { Router } from "express";
import { db } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../auth";
import { CreateFavoriteSchema } from "../types/domain";

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get("/", (req: AuthenticatedRequest, res) => {
  const favorites = db.listFavorites(req.userId!);
  return res.json({ favorites });
});

favoritesRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = CreateFavoriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const favorite = db.addFavorite(req.userId!, parsed.data.meal);
  return res.status(201).json({ favorite });
});

favoritesRouter.delete("/:id", (req: AuthenticatedRequest, res) => {
  const deleted = db.deleteFavorite(req.userId!, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Favorito não encontrado" });
  }
  return res.status(204).send();
});
