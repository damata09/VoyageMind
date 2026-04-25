import type { Router, Request, Response } from "express";
import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../prisma";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../utils/AppError";

const router: Router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const JWT_EXPIRES_IN = "7d";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Apenas imagens são permitidas (jpeg, png, webp)", 400));
    }
  },
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  }),
});

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email já está em uso", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
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

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    passports: user.passports,
  });
});

router.post("/avatar", authenticate, upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  if (!req.file) {
    throw new AppError("Nenhuma imagem foi enviada.", 400);
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
  });

  return res.json({ avatarUrl: updatedUser.avatarUrl });
});

export default router;
