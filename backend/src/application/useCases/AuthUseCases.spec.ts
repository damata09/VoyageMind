import { AuthUseCases } from "./AuthUseCases";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthUseCases", () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let authUseCases: AuthUseCases;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    authUseCases = new AuthUseCases(mockUserRepo);
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should throw AppError if email is already in use", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: "1",
        name: "Test",
        email: "test@test.com",
        password: "hash",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authUseCases.register({ name: "Test", email: "test@test.com", password: "123" })
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should create user with hashed password if email is new", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
      mockUserRepo.create.mockResolvedValue({
        id: "2",
        name: "New User",
        email: "new@test.com",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authUseCases.register({ name: "New User", email: "new@test.com", password: "password" });

      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        name: "New User",
        email: "new@test.com",
        password: "hashed_password",
        avatarUrl: null,
      });
      expect(result.id).toBe("2");
    });
  });

  describe("login", () => {
    it("should throw AppError if user does not exist", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authUseCases.login({ email: "notfound@test.com", password: "123" })
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw AppError if password is incorrect", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: "1",
        name: "Test",
        email: "test@test.com",
        password: "hash",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authUseCases.login({ email: "test@test.com", password: "wrong" })
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should return valid JWT token if credentials are correct", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: "1",
        name: "Test",
        email: "test@test.com",
        password: "hash",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("fake_token");

      const result = await authUseCases.login({ email: "test@test.com", password: "correct" });

      expect(jwt.sign).toHaveBeenCalled();
      expect(result.token).toBe("fake_token");
      expect(result.user.id).toBe("1");
    });
  });
});
