import { AIUseCases } from "./AIUseCases";
import { IAIRepository, GenerateRouteInput } from "../../domain/repositories/IAIRepository";

// Mock para MongoClient
jest.mock("../../infrastructure/database/MongoClient", () => ({
  getMongoDb: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
      updateOne: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
    }),
  }),
}));

describe("AIUseCases", () => {
  let mockAIRepo: jest.Mocked<IAIRepository>;
  let aiUseCases: AIUseCases;

  beforeEach(() => {
    mockAIRepo = {
      generateRoute: jest.fn(),
    };
    aiUseCases = new AIUseCases(mockAIRepo);
  });

  it("should return generated route text", async () => {
    mockAIRepo.generateRoute.mockResolvedValue("Roteiro de teste");

    const text = await aiUseCases.chat("user-1", "Quero ir para o Japão");

    expect(text).toBe("Roteiro de teste");
    expect(mockAIRepo.generateRoute).toHaveBeenCalled();
  });
});
