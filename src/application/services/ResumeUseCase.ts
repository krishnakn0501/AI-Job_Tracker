// src/application/services/ResumeUseCase.ts

import { IResumeRepository } from "../interfaces/IResumeRepository";
import { ResumeDto, CreateResumeInput } from "../dtos/ResumeDto";
import { Resume } from "@/domains/resume/entities/Resume";
import { ResumeLabel } from "@/domains/resume/value-objects/ResumeLabel";
import { Result } from "@/shared/types/Result";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ValidationError } from "@/shared/errors/ValidationError";

export class ResumeUseCase {
  constructor(private readonly repository: IResumeRepository) {}

  async getAll(userId: string): Promise<Result<ResumeDto[]>> {
    const resumes = await this.repository.findByUserId(userId);
    return Result.success(resumes.map((r) => this.toDto(r)));
  }

  async getById(id: string, userId: string): Promise<Result<ResumeDto>> {
    const resume = await this.repository.findById(id);

    if (!resume) {
      return Result.failure(new NotFoundError("Resume", id));
    }

    if (resume.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    return Result.success(this.toDto(resume));
  }

  async create(
    input: CreateResumeInput,
    userId: string
  ): Promise<Result<ResumeDto>> {
    try {
      const existingCount = await this.repository.findByUserId(userId).then(
        (resumes) => resumes.length
      );

      const resume = Resume.create({
        userId,
        fileId: input.fileId,
        filename: input.filename,
        label: ResumeLabel.create(input.label),
        isBase: input.isBase ?? existingCount === 0,
        content: input.content,
      });

      await this.repository.create(resume);
      return Result.success(this.toDto(resume));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return Result.failure(error);
      }
      return Result.failure(error as Error);
    }
  }

  async updateLabel(
    id: string,
    userId: string,
    label: string
  ): Promise<Result<ResumeDto>> {
    const resume = await this.repository.findById(id);

    if (!resume) {
      return Result.failure(new NotFoundError("Resume", id));
    }

    if (resume.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    try {
      resume.updateLabel(label);
      await this.repository.update(resume);
      return Result.success(this.toDto(resume));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    const resume = await this.repository.findById(id);

    if (!resume) {
      return Result.failure(new NotFoundError("Resume", id));
    }

    if (resume.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    const wasBase = resume.isBase;
    const applicationLinks = 0; // TODO: count linked applications from repository

    await this.repository.delete(id);

    // If this was the base resume, promote the most recently created remaining one
    if (wasBase) {
      const remaining = await this.repository.findByUserId(userId);
      const promoted = remaining
        .filter((r) => r.id !== id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (promoted) {
        promoted.setAsBase(true);
        await this.repository.update(promoted);
      }
    }

    return Result.success(undefined);
  }

  async setAsBase(id: string, userId: string): Promise<Result<void>> {
    const resume = await this.repository.findById(id);

    if (!resume) {
      return Result.failure(new NotFoundError("Resume", id));
    }

    if (resume.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    await this.repository.unsetAllBases(userId);
    await this.repository.setAsBase(userId, id);
    return Result.success(undefined);
  }

  private toDto(resume: Resume): ResumeDto {
    return {
      id: resume.id,
      userId: resume.userId,
      fileId: resume.fileId,
      filename: resume.filename,
      label: resume.label,
      isBase: resume.isBase,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }
}