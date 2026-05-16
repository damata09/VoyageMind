import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { getMongoDb } from "../../infrastructure/database/MongoClient";
import { logger } from "../../config/logger";

export class UserUseCases {
  constructor(private userRepository: IUserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    
    // We avoid returning passwords
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");

    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) throw new AppError("Email já está em uso", 409, "EMAIL_IN_USE");
    }

    const updatedUser = await this.userRepository.update(userId, {
      name: data.name ?? user.name,
      email: data.email ?? user.email,
    });

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const updatedUser = await this.userRepository.update(userId, { avatarUrl });
    return { avatarUrl: updatedUser.avatarUrl };
  }

  async deleteAccount(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");

    await this.userRepository.delete(userId);

    try {
      const db = await getMongoDb();
      await db.collection("chat_history").deleteOne({ userId });
    } catch (err) {
      logger.error("Erro ao deletar histórico do MongoDB:", err);
    }
  }
}
