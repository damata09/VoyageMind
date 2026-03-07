import type { Router, Response } from "express";
import express from "express";
import prisma from "../prisma";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router: Router = express.Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  try {
    const passports = await prisma.passport.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(passports);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar passports" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const id = String(req.params.id);

  try {
    const passport = await prisma.passport.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!passport) {
      return res.status(404).json({ message: "Passport não encontrado" });
    }

    return res.json(passport);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar passport" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const { title, description, tag } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Título é obrigatório" });
  }

  try {
    const passport = await prisma.passport.create({
      data: {
        title,
        description,
        tag,
        userId: req.user.id,
      },
    });

    return res.status(201).json(passport);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao criar passport" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const id = String(req.params.id);
  const { title, description, tag } = req.body;

  try {
    const existing = await prisma.passport.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Passport não encontrado" });
    }

    const passport = await prisma.passport.update({
      where: { id: existing.id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        tag: tag ?? existing.tag,
      },
    });

    return res.json(passport);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar passport" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const id = String(req.params.id);

  try {
    const existing = await prisma.passport.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Passport não encontrado" });
    }

    await prisma.passport.delete({
      where: { id: existing.id },
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro ao apagar passport" });
  }
});

export default router;

