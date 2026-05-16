import { IUserRepository } from "../../domain/repositories/IUserRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import { RegisterDTO, LoginDTO } from "../dtos/AuthDTO";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export class AuthUseCases {
  constructor(private userRepository: IUserRepository) {}

  async register(data: RegisterDTO) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(data.password)) {
      throw new AppError("A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.", 400, "WEAK_PASSWORD");
    }

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email já está em uso", 409, "EMAIL_IN_USE");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      avatarUrl: null,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(data: LoginDTO) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user || !user.password) {
      throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
