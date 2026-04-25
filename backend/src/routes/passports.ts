import type { Router, Response } from "express";
import express from "express";
import { z } from "zod";
import prisma from "../prisma";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../utils/AppError";

const router: Router = express.Router();

router.use(authenticate);

const passportIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError("Usuário não autenticado", 401);

  const passports = await prisma.passport.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json(passports);
});

router.get("/:id", validate(passportIdSchema), async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError("Usuário não autenticado", 401);

  const id = String(req.params.id);

  const passport = await prisma.passport.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!passport) {
    throw new AppError("Passport não encontrado", 404);
  }

  return res.json(passport);
});

const createPassportSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    tag: z.string().optional(),
    unlockDate: z.string().optional(),
  }),
});

router.post("/", validate(createPassportSchema), async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError("Usuário não autenticado", 401);

  const { title, description, tag, unlockDate } = req.body;

  const passport = await prisma.passport.create({
    data: {
      title,
      description,
      tag,
      unlockDate: unlockDate ? new Date(unlockDate) : null,
      userId: req.user.id,
    },
  });

  return res.status(201).json(passport);
});

const updatePassportSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: z.object({
    title: z.string().min(1, "Título não pode ser vazio").optional(),
    description: z.string().optional(),
    tag: z.string().optional(),
    unlockDate: z.string().optional(),
  }),
});

router.put("/:id", validate(updatePassportSchema), async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError("Usuário não autenticado", 401);

  const id = String(req.params.id);
  const { title, description, tag, unlockDate } = req.body;

  const existing = await prisma.passport.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existing) {
    throw new AppError("Passport não encontrado", 404);
  }

  const passport = await prisma.passport.update({
    where: { id: existing.id },
    data: {
      title: title ?? existing.title,
      description: description ?? existing.description,
      tag: tag ?? existing.tag,
      unlockDate: unlockDate !== undefined ? (unlockDate ? new Date(unlockDate) : null) : existing.unlockDate,
    },
  });

  return res.json(passport);
});

router.delete("/:id", validate(passportIdSchema), async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError("Usuário não autenticado", 401);

  const id = String(req.params.id);

  const existing = await prisma.passport.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existing) {
    throw new AppError("Passport não encontrado", 404);
  }

  await prisma.passport.delete({
    where: { id: existing.id },
  });

  return res.status(204).send();
});

export default router;
