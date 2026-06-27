// src/infrastructure/persistence/prisma/repositories/ApplicationRepository.ts

import { prisma } from "../PrismaClient";
import { ApplicationMapper } from "../mappers/ApplicationMapper";
import { IApplicationRepository } from "@/application/interfaces/IApplicationRepository";
import { Application } from "@/domains/application/entities/Application";
import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";
import type { Prisma } from "@prisma/client";

export class PrismaApplicationRepository implements IApplicationRepository {
  async findById(id: string): Promise<Application | null> {
    const data = await prisma.application.findUnique({
      where: { id },
      include: { resumeBase: true },
    });

    return data ? ApplicationMapper.toDomain(data) : null;
  }

  async findByUserId(
    userId: string,
    options: {
      status?: ApplicationStatus;
      search?: string;
      limit?: number;
    } = {}
  ): Promise<Application[]> {
    const { status, search, limit = 100 } = options;

    const where: Prisma.ApplicationWhereInput = { userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }

    const data = await prisma.application.findMany({
      where,
      orderBy: { appliedDate: "desc" },
      take: limit,
      include: { resumeBase: true },
    });

    return data.map(ApplicationMapper.toDomain);
  }

  async save(application: Application): Promise<void> {
    const data = ApplicationMapper.toPrisma(application);
    await prisma.application.upsert({
      where: { id: application.id },
      create: data as Prisma.ApplicationCreateInput,
      update: data as Prisma.ApplicationUpdateInput,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.application.delete({ where: { id } });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.application.count({ where: { userId } });
  }
}