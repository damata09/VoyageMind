import { IPassportRepository } from "../../domain/repositories/IPassportRepository";
import { Passport } from "../../domain/entities/Passport";
import prisma from "../../prisma";

export class PrismaPassportRepository implements IPassportRepository {
  async findById(id: string, userId: string): Promise<Passport | null> {
    return prisma.passport.findFirst({
      where: { id, userId },
    });
  }

  async findAllByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.passport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.passport.count({ where: { userId } }),
    ]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<Passport, "id" | "createdAt">): Promise<Passport> {
    return prisma.passport.create({
      data,
    });
  }

  async update(id: string, data: Partial<Passport>): Promise<Passport> {
    return prisma.passport.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.passport.delete({ where: { id } });
  }

  async getUserStats(userId: string): Promise<{ total: number; tagsCount: Record<string, number> }> {
    const passports = await prisma.passport.findMany({
      where: { userId },
      select: { tag: true },
    });

    const tagsCount: Record<string, number> = {};
    passports.forEach((p: { tag: string | null }) => {
      const tag = p.tag || "Sem Tag";
      tagsCount[tag] = (tagsCount[tag] || 0) + 1;
    });

    return {
      total: passports.length,
      tagsCount,
    };
  }
}
