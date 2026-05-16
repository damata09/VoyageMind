import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GEMINI_API_KEY: z.string().min(1),
  MONGODB_URI: z.string().min(1),
  PORT: z.string().default("3333"),
});

import { logger } from "./logger";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("Variáveis de ambiente inválidas:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
