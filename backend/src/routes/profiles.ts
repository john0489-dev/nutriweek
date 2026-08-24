import { Router } from "express";
import { db } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../auth";
import { CreateProfileSchema, UpdateProfileSchema } from "../types/domain";

export const profilesRouter = Router();

profilesRouter.use(requireAuth);

profilesRouter.get("/", (req: AuthenticatedRequest, res) => {
  const profiles = db.listProfiles(req.userId!);
  return res.json({ profiles });
});

profilesRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = CreateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const { isPrimary, ...rest } = parsed.data;
  const profile = db.createProfile(req.userId!, {
    ...rest,
    isPrimary: isPrimary ?? false,
  });
  return res.status(201).json({ profile });
});

profilesRouter.put("/:id", (req: AuthenticatedRequest, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const updated = db.updateProfile(req.userId!, req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "Perfil não encontrado" });
  }
  return res.json({ profile: updated });
});

profilesRouter.delete("/:id", (req: AuthenticatedRequest, res) => {
  const profiles = db.listProfiles(req.userId!);
  if (profiles.length <= 1) {
    return res
      .status(400)
      .json({ error: "Você precisa manter ao menos um perfil" });
  }
  const deleted = db.deleteProfile(req.userId!, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Perfil não encontrado" });
  }
  return res.status(204).send();
});
