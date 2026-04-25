import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Token não fornecido", 401);
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    throw new AppError("Token inválido ou expirado", 401);
  }
}

export async function loadAuthenticatedUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { passports: true },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  (req as AuthRequest).user = {
    id: user.id,
    email: user.email,
  };

  next();
}
