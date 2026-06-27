// src/infrastructure/persistence/prisma/mappers/ResumeMapper.ts

import type { ResumeBase as PrismaResume } from "@prisma/client";
import { Resume } from "@/domains/resume/entities/Resume";
import { ResumeLabel } from "@/domains/resume/value-objects/ResumeLabel";

export class ResumeMapper {
  static toDomain(data: PrismaResume): Resume {
    return Resume.restore({
      id: data.id,
      userId: data.userId,
      fileId: data.fileId,
      filename: data.filename,
      label: ResumeLabel.create(data.label),
      isBase: data.isBase,
      content: (data.content as Record<string, unknown>) ?? undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  static toPrisma(entity: Resume): Record<string, unknown> {
    return {
      id: entity.id,
      userId: entity.userId,
      fileId: entity.fileId,
      filename: entity.filename,
      label: entity.label,
      isBase: entity.isBase,
      content: entity.content ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}