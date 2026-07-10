// src/application/services/ApplicationUseCase.ts

import { IApplicationRepository } from "../interfaces/IApplicationRepository";
import { ApplicationDto, CreateApplicationInput } from "../dtos/ApplicationDto";
import { Application } from "@/domains/application/entities/Application";
import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";
import { Result } from "@/shared/types/Result";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ValidationError } from "@/shared/errors/ValidationError";

export class ApplicationUseCase {
  constructor(private readonly repository: IApplicationRepository) {}

  async getAll(
    userId: string,
    options: { status?: ApplicationStatus; search?: string } = {}
  ): Promise<Result<ApplicationDto[]>> {
    try {
      const applications = await this.repository.findByUserId(userId, options);
      return Result.success(applications.map((a) => this.toDto(a)));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getById(id: string, userId: string): Promise<Result<ApplicationDto>> {
    const application = await this.repository.findById(id);

    if (!application) {
      return Result.failure(new NotFoundError("Application", id));
    }

    if (application.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    return Result.success(this.toDto(application));
  }

  async create(
    input: CreateApplicationInput,
    userId: string
  ): Promise<Result<ApplicationDto>> {
    try {
      const application = Application.create({
        userId,
        company: input.company.trim(),
        role: input.role.trim(),
        jdText: input.jdText?.trim(),
        jdUrl: input.jdUrl?.trim(),
        resumeBaseId: input.resumeBaseId,
        status: input.status ?? ApplicationStatus.Applied,
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : new Date(),
        followUpDate: input.followUpDate
          ? new Date(input.followUpDate)
          : undefined,
        interviewDate: input.interviewDate
          ? new Date(input.interviewDate)
          : undefined,
        notes: input.notes?.trim(),
        generationStatus: input.skipTailoring ? "skipped" : (input.resumeBaseId ? "pending" : "skipped"),
        // S10 — reminder overrides
        reminderOverrideEnabled: input.reminderOverrideEnabled,
        overrideReminderHour: input.overrideReminderHour,
        overrideReminderAmPm: input.overrideReminderAmPm,
        overrideReminderOffsetDays: input.overrideReminderOffsetDays,
        overrideReminderRepeat: input.overrideReminderRepeat,
      });

      await this.repository.save(application);
      return Result.success(this.toDto(application));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return Result.failure(error);
      }
      return Result.failure(error as Error);
    }
  }

  async updateStatus(
    id: string,
    userId: string,
    newStatus: ApplicationStatus
  ): Promise<Result<void>> {
    const application = await this.repository.findById(id);

    if (!application) {
      return Result.failure(new NotFoundError("Application", id));
    }

    if (application.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    try {
      application.updateStatus(newStatus);
      await this.repository.save(application);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async updateDates(
    id: string,
    userId: string,
    dates: {
      followUpDate?: string | null;
      interviewDate?: string | null;
    }
  ): Promise<Result<void>> {
    const application = await this.repository.findById(id);

    if (!application) {
      return Result.failure(new NotFoundError("Application", id));
    }

    if (application.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    try {
      const followUp = dates.followUpDate !== undefined 
        ? (dates.followUpDate ? new Date(dates.followUpDate) : null) 
        : undefined;
      const interview = dates.interviewDate !== undefined 
        ? (dates.interviewDate ? new Date(dates.interviewDate) : null) 
        : undefined;

      application.updateDates(followUp, interview);
      await this.repository.save(application);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  // S10 — Update per-application reminder override
  async updateReminderOverride(
    id: string,
    userId: string,
    override: {
      reminderOverrideEnabled?: boolean;
      overrideReminderHour?: number | null;
      overrideReminderAmPm?: string | null;
      overrideReminderOffsetDays?: number | null;
      overrideReminderRepeat?: boolean | null;
    }
  ): Promise<Result<ApplicationDto>> {
    const application = await this.repository.findById(id);

    if (!application) {
      return Result.failure(new NotFoundError("Application", id));
    }

    if (application.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    application.updateReminderOverride({
      reminderOverrideEnabled: override.reminderOverrideEnabled,
      overrideReminderHour: override.overrideReminderHour,
      overrideReminderAmPm: override.overrideReminderAmPm,
      overrideReminderOffsetDays: override.overrideReminderOffsetDays,
      overrideReminderRepeat: override.overrideReminderRepeat,
    });

    await this.repository.save(application);
    return Result.success(this.toDto(application));
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    const application = await this.repository.findById(id);

    if (!application) {
      return Result.failure(new NotFoundError("Application", id));
    }

    if (application.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    await this.repository.delete(id);
    return Result.success(undefined);
  }

  private toDto(application: Application): ApplicationDto {
    return {
      id: application.id,
      userId: application.userId,
      company: application.company,
      role: application.role,
      jdText: application.jdText,
      jdUrl: application.jdUrl,
      status: application.status,
      appliedDate: application.appliedDate.toISOString(),
      followUpDate: application.followUpDate?.toISOString(),
      interviewDate: application.interviewDate?.toISOString(),
      generationStatus: application.generationStatus,
      resumeMarkdown: application.resumeMarkdown,
      coverLetterMarkdown: application.coverLetterMarkdown,
      resumeReviewPath: application.resumeReviewPath,
      resumeFinalPath: application.resumeFinalPath,
      coverLetterReviewPath: application.coverLetterReviewPath,
      coverLetterFinalPath: application.coverLetterFinalPath,
      roleTitleChanged: application.roleTitleChanged,
      roleTitleNote: application.roleTitleNote,
      notes: application.notes,
      resumeBaseId: application.resumeBaseId,
      // S10
      reminderOverrideEnabled: application.reminderOverrideEnabled,
      overrideReminderHour: application.overrideReminderHour,
      overrideReminderAmPm: application.overrideReminderAmPm,
      overrideReminderOffsetDays: application.overrideReminderOffsetDays,
      overrideReminderRepeat: application.overrideReminderRepeat,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }
}