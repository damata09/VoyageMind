import { env } from "./config/env";
import { logger } from "./config/logger";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import passportRoutes from "./routes/passports";
import { AppError } from "./utils/AppError";
import { getMongoDb } from "./infrastructure/database/MongoClient";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger.json";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

// Clean Architecture - AI
import { Router } from "express";
import { z } from "zod";
import { validate } from "./middleware/validate";
import { authenticate } from "./middleware/auth";
import { GeminiAIRepository } from "./infrastructure/ai/GeminiAIRepository";
import { AIUseCases } from "./application/useCases/AIUseCases";
import { AIController } from "./infrastructure/web/controllers/AIController";

const port = env.PORT;

const allowedOrigins = [
  "https://voyagemind.vercel.app",
  "http://localhost:5173",
];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Limite de requisições de IA atingido." },
});

const aiRepository = new GeminiAIRepository();
const aiUseCases = new AIUseCases(aiRepository);
const aiController = new AIController(aiUseCases);

const aiRouter = Router();

const suggestSchema = z.object({
  body: z.object({
    place: z.string().min(1, "Lugar é obrigatório"),
    budget: z.string().min(1, "Orçamento é obrigatório"),
    days: z.number().int().positive("Dias deve ser positivo"),
    blindMode: z.boolean().optional(),
  }),
});

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Mensagem é obrigatória"),
    blindMode: z.boolean().optional(),
  }),
});

aiRouter.post("/suggest", validate(suggestSchema), (req, res, next) => {
  aiController.suggest(req, res).catch(next);
});
aiRouter.get("/history", authenticate, (req, res, next) => {
  aiController.getHistory(req as any, res).catch(next);
});
aiRouter.delete("/history", authenticate, (req, res, next) => {
  aiController.clearHistory(req as any, res).catch(next);
});
aiRouter.post("/chat", authenticate, validate(chatSchema), (req, res, next) => {
  aiController.chat(req as any, res).catch(next);
});

import compression from "compression";

export function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError("Origem não permitida pelo CORS", 403));
      }
    },
    credentials: true,
  }));

  app.use(compression());
  app.use(express.json());
  app.use(mongoSanitize());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "VoyageMind API ok" });
  });

  app.use("/auth", authLimiter, authRoutes);
  app.use("/passports", passportRoutes);
  app.use("/ai", aiLimiter, aiRouter);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  // Middleware de tratamento de erros genérico
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ message: err.message, code: err.code });
    }
    
    logger.error(err);
    res.status(500).json({ message: "Erro interno do servidor", code: "GENERIC_ERROR" });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(port, async () => {
    logger.info(`Servidor rodando na porta ${port}`);

    if (env.MONGODB_URI) {
      try {
        await getMongoDb();
        logger.info('Conectado ao MongoDB para Logs de IA');
      } catch (err) {
        logger.error('Falha ao conectar no MongoDB:', err);
      }
    } else {
      logger.info('MONGODB_URI não fornecida. Logs de IA não serão persistidos.');
    }
  });
}
