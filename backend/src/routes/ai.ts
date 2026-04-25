import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../utils/AppError";

const router = Router();

// Endpoint antigo mantido para retrocompatibilidade, se necessário
const suggestSchema = z.object({
  body: z.object({
    place: z.string().min(1, "Lugar é obrigatório"),
    budget: z.string().min(1, "Orçamento é obrigatório"),
    days: z.number().int().positive("Dias deve ser positivo"),
    blindMode: z.boolean().optional(),
  }),
});

router.post("/suggest", validate(suggestSchema), (req, res) => {
  // ... mantido como estava ...
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
});

// NOVO ENDPOINT DE CHAT COM GEMINI
const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Mensagem é obrigatória"),
    history: z.array(z.object({
      role: z.enum(["user", "model"]),
      parts: z.array(z.object({ text: z.string() }))
    })).optional(),
    blindMode: z.boolean().optional(),
  }),
});

router.post("/chat", validate(chatSchema), async (req, res) => {
  const { message, history, blindMode } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("A chave GEMINI_API_KEY não está configurada no backend (.env). Por favor, adicione uma chave válida para usar a IA real.", 500);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: blindMode 
        ? "Você é o VoyageMind, um guia de viagens. O usuário está no 'Modo Misterioso' (Blind Destination). O usuário pode mencionar lugares, mas você deve responder com enigmas, focando em manter a surpresa e o mistério sem nomear os locais explicitamente, criando roteiros mágicos." 
        : "Você é o VoyageMind, um assistente inteligente de planejamento de viagens de alto nível. Ajude o usuário a criar roteiros, escolher pontos turísticos e otimizar orçamentos de forma clara, amigável e rica em detalhes, usando formatação markdown limpa." 
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    throw new AppError("Falha ao comunicar com a IA do Google. Verifique sua GEMINI_API_KEY.", 500);
  }
});

export default router;
