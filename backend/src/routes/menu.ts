import { Router } from "express";
import { MenuRequestSchema } from "../types/menu";
import { generateMenu } from "../services/menuGenerator";

export const menuRouter = Router();

/**
 * POST /api/menu/generate
 * Gera (ou reotimiza) um cardápio semanal personalizado via IA.
 */
menuRouter.post("/generate", async (req, res) => {
  const parsed = MenuRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Requisição inválida",
      details: parsed.error.flatten(),
    });
  }

  try {
    const menu = await generateMenu(parsed.data);
    return res.json(menu);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[menu.generate] erro:", err);
    return res.status(502).json({
      error: "Falha ao gerar cardápio com a IA",
      message: (err as Error).message,
    });
  }
});
