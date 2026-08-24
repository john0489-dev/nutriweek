import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { PublicUser } from "./types/domain";

// Se JWT_SECRET não estiver definido, geramos um por processo — funciona
// para dev (rodando localmente), mas invalida sessões a cada restart do
// servidor. Defina JWT_SECRET no .env para persistir sessões entre restarts.
const JWT_SECRET = process.env.JWT_SECRET ?? crypto.randomBytes(32).toString("hex");
const TOKEN_EXPIRY = "30d";

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export function signToken(user: PublicUser): string {
  const payload: AuthTokenPayload = { userId: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/** Middleware: exige um Bearer token válido, injeta req.userId / req.userEmail. */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}
