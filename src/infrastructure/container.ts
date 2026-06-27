// src/infrastructure/container.ts

/**
 * Composition Root — manual dependency injection container.
 * All application dependencies are wired here.
 */

// Repositories
import { PrismaApplicationRepository } from "./persistence/prisma/repositories/ApplicationRepository";
import { PrismaUserRepository } from "./persistence/prisma/repositories/UserRepository";
import { PrismaResumeRepository } from "./persistence/prisma/repositories/ResumeRepository";
import { PrismaSupportQueryRepository } from "./persistence/prisma/repositories/SupportQueryRepository";

// Use cases
import { ApplicationUseCase } from "@/application/services/ApplicationUseCase";
import { UserUseCase } from "@/application/services/UserUseCase";
import { ResumeUseCase } from "@/application/services/ResumeUseCase";
import { AuthUseCase } from "@/application/services/AuthUseCase";
import { ReminderUseCase } from "@/application/services/ReminderUseCase";
import { SupportUseCase } from "@/application/services/SupportUseCase";

// Repository instances
export const applicationRepo = new PrismaApplicationRepository();
export const userRepo = new PrismaUserRepository();
export const resumeRepo = new PrismaResumeRepository();
export const supportRepo = new PrismaSupportQueryRepository();

// Use case instances
export const applicationUseCase = new ApplicationUseCase(applicationRepo);
export const userUseCase = new UserUseCase(userRepo);
export const resumeUseCase = new ResumeUseCase(resumeRepo);
export const authUseCase = new AuthUseCase(userRepo);
export const reminderUseCase = new ReminderUseCase(applicationRepo);
export const supportUseCase = new SupportUseCase(supportRepo);

// Convenience container export
export const container = {
  applicationRepo,
  userRepo,
  resumeRepo,
  supportRepo,
  applicationUseCase,
  userUseCase,
  resumeUseCase,
  authUseCase,
  reminderUseCase,
  supportUseCase,
};

export type Container = typeof container;