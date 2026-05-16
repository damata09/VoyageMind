import { IAIRepository, GenerateRouteInput } from "../../domain/repositories/IAIRepository";
import { getMongoDb } from "../../infrastructure/database/MongoClient";
import { logger } from "../../config/logger";

export class AIUseCases {
  constructor(private aiRepository: IAIRepository) {}

  async getHistory(userId: string) {
    try {
      const db = await getMongoDb();
      const history = await db.collection("chat_history").findOne({ userId });
      return history?.messages || [];
    } catch (error) {
      logger.error("Erro ao buscar histórico:", error);
      return [];
    }
  }

  async clearHistory(userId: string) {
    try {
      const db = await getMongoDb();
      await db.collection("chat_history").deleteOne({ userId });
    } catch (error) {
      logger.error("Erro ao deletar histórico:", error);
      throw error;
    }
  }

  async chat(userId: string, message: string, blindMode?: boolean) {
    const history = await this.getHistory(userId);
    
    let geminiHistory: any[] = [];
    if (history.length > 0) {
      geminiHistory = history.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
    }

    const text = await this.aiRepository.generateRoute({
      message,
      blindMode: blindMode || false,
      history: geminiHistory
    });

    const newMessages = [
      { role: "user", content: message, createdAt: new Date() },
      { role: "model", content: text, createdAt: new Date() }
    ];

    try {
      const db = await getMongoDb();
      await db.collection("chat_history").updateOne(
        { userId },
        { 
          $push: { messages: { $each: newMessages } },
          $setOnInsert: { createdAt: new Date() },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error("Erro ao salvar log no Mongo:", error);
    }

    return text;
  }
}
