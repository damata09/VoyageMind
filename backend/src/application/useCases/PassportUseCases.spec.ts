import { PassportUseCases } from "./PassportUseCases";
import { IPassportRepository } from "../../domain/repositories/IPassportRepository";
import { Passport } from "../../domain/entities/Passport";

import { AppError } from "../../utils/AppError";

describe("PassportUseCases", () => {
  let mockPassportRepo: jest.Mocked<IPassportRepository>;
  let passportUseCases: PassportUseCases;

  beforeEach(() => {
    mockPassportRepo = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getUserStats: jest.fn(),
    };
    passportUseCases = new PassportUseCases(mockPassportRepo);
  });

  it("should get user stats successfully", async () => {
    mockPassportRepo.getUserStats.mockResolvedValue({
      total: 2,
      tagsCount: { "Misterioso": 1, "Aventura": 1 },
    });

    const stats = await passportUseCases.getStats("user-1");

    expect(stats.total).toBe(2);
    expect(stats.tagsCount["Misterioso"]).toBe(1);
    expect(mockPassportRepo.getUserStats).toHaveBeenCalledWith("user-1");
  });

  it("should create a passport", async () => {
    const fakePassport: Passport = {
      id: "pass-1",
      title: "Viagem",
      description: "Desc",
      tag: "Tag",
      unlockDate: null,
      userId: "user-1",
      createdAt: new Date(),
    };

    mockPassportRepo.create.mockResolvedValue(fakePassport);

    const result = await passportUseCases.createPassport("user-1", {
      title: "Viagem",
      description: "Desc",
      tag: "Tag",
    });

    expect(result.id).toBe("pass-1");
    expect(mockPassportRepo.create).toHaveBeenCalled();
  });
  });

  describe("getPassport", () => {
    it("should throw AppError when passport is not found", async () => {
      mockPassportRepo.findById.mockResolvedValue(null);
      await expect(
        passportUseCases.getPassport("inexistente", "user-1")
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("updatePassport", () => {
    it("should throw AppError when passport does not belong to user", async () => {
      mockPassportRepo.findById.mockResolvedValue(null);
      await expect(
        passportUseCases.updatePassport("pass-1", "user-outro", { title: "Novo" })
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should update only provided fields (partial update)", async () => {
      const existing: Passport = {
        id: "pass-1",
        title: "Original",
        description: "Desc original",
        tag: "Tag",
        unlockDate: null,
        userId: "user-1",
        createdAt: new Date(),
      };
      mockPassportRepo.findById.mockResolvedValue(existing);
      mockPassportRepo.update.mockResolvedValue({ ...existing, title: "Atualizado" });

      const result = await passportUseCases.updatePassport("pass-1", "user-1", { title: "Atualizado" });

      expect(mockPassportRepo.update).toHaveBeenCalledWith("pass-1", expect.objectContaining({
        title: "Atualizado",
        description: "Desc original",
      }));
    });
  });

  describe("deletePassport", () => {
    it("should throw AppError when passport does not exist", async () => {
      mockPassportRepo.findById.mockResolvedValue(null);
      await expect(
        passportUseCases.deletePassport("inexistente", "user-1")
      ).rejects.toBeInstanceOf(AppError);
    });
  });
});
