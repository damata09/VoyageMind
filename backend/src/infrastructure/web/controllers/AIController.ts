import { type Request, type Response } from "express";
import { AIUseCases } from "../../../application/useCases/AIUseCases";
import { AuthRequest } from "../../../middleware/auth";
import { AppError } from "../../../utils/AppError";

export class AIController {
  constructor(private aiUseCases: AIUseCases) {}

  async getHistory(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const history = await this.aiUseCases.getHistory(userId);
    res.json(history);
  }

  async clearHistory(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    try {
      await this.aiUseCases.clearHistory(userId);
      res.status(204).send();
    } catch (err) {
      throw new AppError("Erro ao deletar histórico", 500);
    }
  }

  async chat(req: AuthRequest, res: Response) {
    const { message, blindMode } = req.body;
    const userId = req.user!.id;

    const text = await this.aiUseCases.chat(userId, message, blindMode);
    res.json({ text });
  }

  async suggest(req: Request, res: Response) {
    const { place, budget, days, blindMode } = req.body;

    const message = blindMode
      ? `Crie um roteiro misterioso de ${days} dias com orçamento ${budget}. Não revele o destino, use enigmas e suspense.`
      : `Crie um roteiro detalhado para ${place} com duração de ${days} dias e orçamento ${budget}. Use formatação markdown.`;

    const text = await this.aiUseCases.chat("anonymous", message, blindMode ?? false);
    res.json({ text });
  }
}
