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

    if (blindMode) {
      setTimeout(() => {
        res.json({
          title: `Roteiro Secreto de ${days} Dias`,
          overview: `A IA planejou uma aventura misteriosa para você com orçamento ${budget}. O destino é mantido em segredo! Prepare-se para ser surpreendido.`,
          itinerary: [
            `Dia 1: Chegada ao nosso destino secreto. Faça o check-in na acomodação e explore os restaurantes misteriosos próximos.`,
            `Dia 2: Dia focado em vivenciar a atração principal desta região surpresa. Dica: Leve câmera!`,
            `Dia 3: Despedida épica do local misterioso saboreando a cultura local.`
          ],
          tags: ["Cego", "Mistério", "Surpresa"]
        });
      }, 1500);
      return;
    }

    const suggestions = [
      `Dia 1: Chegada em ${place} e exploração do centro histórico. Jantar em um restaurante conceituado.`,
      `Dia 2: Visita aos principais pontos turísticos focando em experiências de ${budget.toLowerCase()} custo.`,
      `Dia 3: Passeio relaxante e compras locais, aproveitando as últimas horas em ${place}.`
    ];

    if (days > 3) {
      suggestions.push(`Dias extras: Imersão cultural nas áreas menos conhecidas de ${place}!`);
    }

    setTimeout(() => {
      res.json({
        title: `Roteiro Inteligente para ${place}`,
        overview: `Com base em um orçamento ${budget} para ${days} dias, aqui está a sugestão ideal para você aproveitar o máximo de ${place}.`,
        itinerary: suggestions,
        tags: ["AI", "Otimizado", "Culture"]
      });
    }, 1500);
  }
}
