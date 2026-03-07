import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import passportRoutes from "./routes/passports";

const app = express();
const port = process.env.PORT ?? 3333;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "VoyageMind API ok" });
});

app.use("/auth", authRoutes);
app.use("/passports", passportRoutes);

// Middleware de tratamento de erros genérico
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Erro interno do servidor" });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

