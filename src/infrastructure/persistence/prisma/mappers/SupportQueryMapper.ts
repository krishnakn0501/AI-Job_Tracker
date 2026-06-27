// src/infrastructure/persistence/prisma/mappers/SupportQueryMapper.ts

import type { SupportQuery as PrismaSupportQuery } from "@prisma/client";
import {
  SupportQuery,
  SupportQueryCategory,
  SupportQueryStatus,
} from "@/domains/support/entities/SupportQuery";

export class SupportQueryMapper {
  static toDomain(data: PrismaSupportQuery): SupportQuery {
    return SupportQuery.restore({
      id: data.id,
      userId: data.userId,
      category: this.parseCategory(data.category),
      message: data.message,
      status: this.parseStatus(data.status),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  static toPrisma(entity: SupportQuery): Record<string, unknown> {
    return {
      id: entity.id,
      userId: entity.userId,
      category: entity.category,
      message: entity.message,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static parseCategory(category: string): SupportQueryCategory {
    const values = Object.values(SupportQueryCategory);
    if (!values.includes(category as SupportQueryCategory)) {
      throw new Error(`Invalid support query category: ${category}`);
    }
    return category as SupportQueryCategory;
  }

  private static parseStatus(status: string): SupportQueryStatus {
    const values = Object.values(SupportQueryStatus);
    if (!values.includes(status as SupportQueryStatus)) {
      throw new Error(`Invalid support query status: ${status}`);
    }
    return status as SupportQueryStatus;
  }
}