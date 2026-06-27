// src/infrastructure/persistence/prisma/repositories/SupportQueryRepository.ts

import { prisma } from "../PrismaClient";
import { SupportQueryMapper } from "../mappers/SupportQueryMapper";
import { ISupportQueryRepository } from "@/application/interfaces/ISupportQueryRepository";
import { SupportQuery } from "@/domains/support/entities/SupportQuery";

export class PrismaSupportQueryRepository implements ISupportQueryRepository {
  async findById(id: string): Promise<SupportQuery | null> {
    const data = await prisma.supportQuery.findUnique({ where: { id } });
    return data ? SupportQueryMapper.toDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<SupportQuery[]> {
    const data = await prisma.supportQuery.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return data.map(SupportQueryMapper.toDomain);
  }

  async create(query: SupportQuery): Promise<void> {
    const data = SupportQueryMapper.toPrisma(query);
    await prisma.supportQuery.create({ data: data as any });
  }

  async update(query: SupportQuery): Promise<void> {
    const data = SupportQueryMapper.toPrisma(query);
    await prisma.supportQuery.update({
      where: { id: query.id },
      data: data as any,
    });
  }
}