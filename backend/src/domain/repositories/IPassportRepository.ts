import { Passport } from "../entities/Passport";

export interface IPassportRepository {
  findById(id: string, userId: string): Promise<Passport | null>;
  findAllByUserId(userId: string, page?: number, limit?: number): Promise<{
    data: Passport[];
    total: number;
    page: number;
    totalPages: number;
  } | Passport[]>;
  create(data: Omit<Passport, "id" | "createdAt">): Promise<Passport>;
  update(id: string, data: Partial<Passport>): Promise<Passport>;
  delete(id: string): Promise<void>;
  getUserStats(userId: string): Promise<{ total: number; tagsCount: Record<string, number> }>;
}
