import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = env.JWT_SECRET;

import { TokenBlacklist } from "../infrastructure/cache/TokenBlacklist";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Token não fornecido", 401, "UNAUTHORIZED");
  }

  const token = authHeader.substring("Bearer ".length);

  if (TokenBlacklist.has(token)) {
    throw new AppError("Token inválido", 401, "UNAUTHORIZED");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    throw new AppError("Token inválido ou expirado", 401, "UNAUTHORIZED");
  }
}

export async function loadAuthenticatedUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new AppError("Usuário não autenticado", 401, "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { passports: true },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
  }

  (req as AuthRequest).user = {
    id: user.id,
    email: user.email,
  };

  next();
}
