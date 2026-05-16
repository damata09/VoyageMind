import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../utils/AppError";

import { PrismaUserRepository } from "../infrastructure/database/PrismaUserRepository";
import { AuthUseCases } from "../application/useCases/AuthUseCases";
import { UserUseCases } from "../application/useCases/UserUseCases";
import { AuthController } from "../infrastructure/web/controllers/AuthController";

const router = Router();

// Setup multer
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

// Setup Clean Architecture instances
const userRepository = new PrismaUserRepository();
const authUseCases = new AuthUseCases(userRepository);
const userUseCases = new UserUseCases(userRepository);
const authController = new AuthController(authUseCases, userUseCases);

// Schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nome não pode ser vazio").optional(),
    email: z.string().email("Email inválido").optional(),
  }),
});

// Routes
router.post("/register", validate(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post("/login", validate(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

import { TokenBlacklist } from "../infrastructure/cache/TokenBlacklist";

router.post("/logout", authenticate, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.substring("Bearer ".length);
    TokenBlacklist.add(token);
  }
  res.status(200).json({ message: "Logout efetuado com sucesso" });
});

router.get("/me", authenticate, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

// Nova Feature 1: Atualização de Perfil
router.put("/me", authenticate, validate(updateProfileSchema), (req, res, next) => {
  authController.updateProfile(req, res).catch(next);
});

// Nova Feature 3: Exclusão de Conta
router.delete("/me", authenticate, (req, res, next) => {
  authController.deleteAccount(req, res).catch(next);
});

router.post("/avatar", authenticate, upload.single("avatar"), (req, res, next) => {
  authController.updateAvatar(req, res).catch(next);
});

export default router;
