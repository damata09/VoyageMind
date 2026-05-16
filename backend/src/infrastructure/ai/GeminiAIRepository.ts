import { IAIRepository, GenerateRouteInput } from "../../domain/repositories/IAIRepository";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AppError("Timeout na API de IA", 504, "AI_TIMEOUT")), ms)
  );
  return Promise.race([promise, timeout]);
};

const withRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
  throw new AppError("Erro na API de IA após múltiplas tentativas", 503);
};

export class GeminiAIRepository implements IAIRepository {
  async generateRoute(input: GenerateRouteInput): Promise<string> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError("A chave GEMINI_API_KEY não está configurada.", 500);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: input.blindMode 
        ? "Você é o VoyageMind, um guia de viagens. O usuário está no 'Modo Misterioso' (Blind Destination). O usuário pode mencionar lugares, mas você deve responder com enigmas, focando em manter a surpresa e o mistério sem nomear os locais explicitamente, criando roteiros mágicos." 
        : "Você é o VoyageMind, um assistente inteligente de planejamento de viagens de alto nível. Ajude o usuário a criar roteiros, escolher pontos turísticos e otimizar orçamentos de forma clara, amigável e rica em detalhes, usando formatação markdown limpa." 
    });

    const action = async () => {
      const chat = model.startChat({
        history: input.history || [],
      });
      const result = await chat.sendMessage(input.message || `Destino: ${input.destination}, Orçamento: ${input.budget}, Dias: ${input.days}`);
      const response = await result.response;
      return response.text();
    };

    return withRetry(() => withTimeout(action(), 15000));
  }
}
