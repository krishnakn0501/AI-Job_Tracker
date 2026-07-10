// src/infrastructure/persistence/prisma/mappers/ApplicationMapper.ts

import type { Application as PrismaApplication } from "@prisma/client";
import { Application } from "@/domains/application/entities/Application";
import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";

export class ApplicationMapper {
  static toDomain(data: PrismaApplication): Application {
    return Application.restore({
      id: data.id,
      userId: data.userId,
      company: data.company,
      role: data.role,
      jdText: data.jdText ?? undefined,
      jdUrl: data.jdUrl ?? undefined,
      status: ApplicationMapper.parseStatus(data.status),
      appliedDate: new Date(data.appliedDate),
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      followUpDone: data.followUpDone,
      interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
      interviewDone: data.interviewDone,
      generationStatus: data.generationStatus,
      resumeMarkdown: data.resumeMarkdown ?? undefined,
      coverLetterMarkdown: data.coverLetterMarkdown ?? undefined,
      resumeReviewPath: data.resumeReviewPath ?? undefined,
      resumeFinalPath: data.resumeFinalPath ?? undefined,
      coverLetterReviewPath: data.coverLetterReviewPath ?? undefined,
      coverLetterFinalPath: data.coverLetterFinalPath ?? undefined,
      roleTitleChanged: data.roleTitleChanged,
      roleTitleNote: data.roleTitleNote ?? undefined,
      notes: data.notes ?? undefined,
      resumeBaseId: data.resumeBaseId ?? undefined,
      // S10
      reminderOverrideEnabled: data.reminderOverrideEnabled,
      overrideReminderHour: data.overrideReminderHour ?? undefined,
      overrideReminderAmPm: data.overrideReminderAmPm ?? undefined,
      overrideReminderOffsetDays: data.overrideReminderOffsetDays ?? undefined,
      overrideReminderRepeat: data.overrideReminderRepeat ?? undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  static toPrisma(entity: Application): Record<string, unknown> {
    return {
      id: entity.id,
      userId: entity.userId,
      company: entity.company,
      role: entity.role,
      jdText: entity.jdText ?? null,
      jdUrl: entity.jdUrl ?? null,
      status: entity.status,
      appliedDate: entity.appliedDate,
      followUpDate: entity.followUpDate ?? null,
      followUpDone: entity.followUpDone,
      interviewDate: entity.interviewDate ?? null,
      interviewDone: entity.interviewDone,
      generationStatus: entity.generationStatus,
      resumeMarkdown: entity.resumeMarkdown ?? null,
      coverLetterMarkdown: entity.coverLetterMarkdown ?? null,
      resumeReviewPath: entity.resumeReviewPath ?? null,
      resumeFinalPath: entity.resumeFinalPath ?? null,
      coverLetterReviewPath: entity.coverLetterReviewPath ?? null,
      coverLetterFinalPath: entity.coverLetterFinalPath ?? null,
      roleTitleChanged: entity.roleTitleChanged,
      roleTitleNote: entity.roleTitleNote ?? null,
      notes: entity.notes ?? null,
      resumeBaseId: entity.resumeBaseId ?? null,
      // S10
      reminderOverrideEnabled: entity.reminderOverrideEnabled,
      overrideReminderHour: entity.overrideReminderHour ?? null,
      overrideReminderAmPm: entity.overrideReminderAmPm ?? null,
      overrideReminderOffsetDays: entity.overrideReminderOffsetDays ?? null,
      overrideReminderRepeat: entity.overrideReminderRepeat ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static parseStatus(status: string): ApplicationStatus {
    const valid = Object.values(ApplicationStatus);
    if (!valid.includes(status as ApplicationStatus)) {
      throw new Error(`Invalid application status: ${status}`);
    }
    return status as ApplicationStatus;
  }
}