// src/application/services/SupportUseCase.ts

import { ISupportQueryRepository } from "../interfaces/ISupportQueryRepository";
import { SupportQueryDto, CreateSupportQueryInput } from "../dtos/SupportQueryDto";
import { SupportQuery, SupportQueryCategory } from "@/domains/support/entities/SupportQuery";
import { Result } from "@/shared/types/Result";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ValidationError } from "@/shared/errors/ValidationError";

export class SupportUseCase {
  constructor(private readonly repository: ISupportQueryRepository) {}

  async getAll(userId: string): Promise<Result<SupportQueryDto[]>> {
    const queries = await this.repository.findByUserId(userId);
    return Result.success(queries.map((q) => this.toDto(q)));
  }

  async create(
    input: CreateSupportQueryInput
  ): Promise<Result<SupportQueryDto>> {
    try {
      const query = SupportQuery.create({
        userId: input.userId,
        category: input.category as unknown as SupportQueryCategory,
        message: input.message,
      });

      await this.repository.create(query);
      return Result.success(this.toDto(query));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return Result.failure(error);
      }
      return Result.failure(error as Error);
    }
  }

  async resolve(id: string, userId: string): Promise<Result<void>> {
    const query = await this.repository.findById(id);

    if (!query) {
      return Result.failure(new NotFoundError("Support query", id));
    }

    if (query.userId !== userId) {
      return Result.failure(new Error("Forbidden"));
    }

    const result = query.resolve();
    if (result.error) {
      return result as Result<void, ValidationError>;
    }

    await this.repository.update(query);
    return Result.success(undefined);
  }

  private toDto(query: SupportQuery): SupportQueryDto {
    return {
      id: query.id,
      userId: query.userId,
      category: query.category as unknown as SupportQueryDto["category"],
      message: query.message,
      status: query.status as unknown as SupportQueryDto["status"],
      createdAt: query.createdAt.toISOString(),
      updatedAt: query.updatedAt.toISOString(),
    };
  }
}