import { Response } from "express";
import { PassportUseCases } from "../../../application/useCases/PassportUseCases";
import { AuthRequest } from "../../../middleware/auth";
import { AppError } from "../../../utils/AppError";

export class PassportController {
  constructor(private passportUseCases: PassportUseCases) {}

  async getAll(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    const result = await this.passportUseCases.getUserPassports(req.user.id, page, limit);
    return res.json(result);
  }

  async getOne(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    const passport = await this.passportUseCases.getPassport(String(req.params.id), req.user.id);
    return res.json(passport);
  }

  async create(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    const passport = await this.passportUseCases.createPassport(req.user.id, req.body);
    return res.status(201).json(passport);
  }

  async update(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    const passport = await this.passportUseCases.updatePassport(String(req.params.id), req.user.id, req.body);
    return res.json(passport);
  }

  async delete(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    await this.passportUseCases.deletePassport(String(req.params.id), req.user.id);
    return res.status(204).send();
  }

  async getStats(req: AuthRequest, res: Response) {
    if (!req.user) throw new AppError("Usuário não autenticado", 401);
    const stats = await this.passportUseCases.getStats(req.user.id);
    return res.json(stats);
  }
}
