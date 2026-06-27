// src/infrastructure/persistence/prisma/repositories/ResumeRepository.ts

import { prisma } from "../PrismaClient";
import { ResumeMapper } from "../mappers/ResumeMapper";
import { IResumeRepository } from "@/application/interfaces/IResumeRepository";
import { Resume } from "@/domains/resume/entities/Resume";

export class PrismaResumeRepository implements IResumeRepository {
  async findById(id: string): Promise<Resume | null> {
    const data = await prisma.resumeBase.findUnique({ where: { id } });
    return data ? ResumeMapper.toDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<Resume[]> {
    const data = await prisma.resumeBase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return data.map(ResumeMapper.toDomain);
  }

  async findBaseResumeForUser(userId: string): Promise<Resume | null> {
    const data = await prisma.resumeBase.findFirst({
      where: { userId, isBase: true },
    });
    return data ? ResumeMapper.toDomain(data) : null;
  }

  async create(resume: Resume): Promise<void> {
    const data = ResumeMapper.toPrisma(resume);
    await prisma.resumeBase.create({ data: data as any });
  }

  async update(resume: Resume): Promise<void> {
    const data = ResumeMapper.toPrisma(resume);
    await prisma.resumeBase.update({
      where: { id: resume.id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.resumeBase.delete({ where: { id } });
  }

  async setAsBase(userId: string, id: string): Promise<void> {
    await prisma.resumeBase.updateMany({
      where: { userId, id },
      data: { isBase: true },
    });
  }

  async unsetAllBases(userId: string): Promise<void> {
    await prisma.resumeBase.updateMany({
      where: { userId, isBase: true },
      data: { isBase: false },
    });
  }
}