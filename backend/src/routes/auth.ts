import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { signToken } from "../auth";
import { LoginSchema, RegisterSchema, type PublicUser } from "../types/domain";

export const authRouter = Router();

function toPublicUser(user: { id: string; email: string }): PublicUser {
  return { id: user.id, email: user.email };
}

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  if (await db.findUserByEmail(email)) {
    return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.createUser(email, passwordHash);
  const token = signToken(toPublicUser(user));

  return res.status(201).json({ token, user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  const token = signToken(toPublicUser(user));
  return res.json({ token, user: toPublicUser(user) });
});
