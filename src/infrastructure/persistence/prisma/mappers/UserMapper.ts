// src/infrastructure/persistence/prisma/mappers/UserMapper.ts

import type { User as PrismaUser } from "@prisma/client";
import { User } from "@/domains/user/entities/User";
import { Email } from "@/domains/user/value-objects/Email";

export class UserMapper {
  static toDomain(data: PrismaUser): User {
    return User.restore({
      id: data.id,
      email: Email.create(data.email),
      passwordHash: data.passwordHash,
      emailVerified: data.emailVerified,
      isAdmin: data.isAdmin,
      theme: this.parseTheme(data.theme),
      username: data.username ?? undefined,
      dob: data.dob ? new Date(data.dob) : undefined,
      country: data.country,
      mobile: data.mobile ?? undefined,
      pendingEmail: data.pendingEmail ?? undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  static toPrisma(entity: User): Record<string, unknown> {
    return {
      id: entity.id,
      email: entity.emailValue,
      passwordHash: entity.passwordHash,
      emailVerified: entity.emailVerified,
      isAdmin: entity.isAdmin,
      theme: entity.theme,
      username: entity.username ?? null,
      dob: entity.dob ?? null,
      country: entity.country,
      mobile: entity.mobile ?? null,
      pendingEmail: entity.pendingEmail ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static parseTheme(theme: string): "light" | "dark" {
    if (theme !== "light" && theme !== "dark") {
      return "light";
    }
    return theme;
  }
}