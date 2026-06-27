// src/application/interfaces/IApplicationRepository.ts

import { Application } from "@/domains/application/entities/Application";
import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";

export interface IApplicationRepository {
  /** Find application by ID */
  findById(id: string): Promise<Application | null>;

  /** Find all applications for a user */
  findByUserId(
    userId: string,
    options?: {
      status?: ApplicationStatus;
      search?: string;
      limit?: number;
    }
  ): Promise<Application[]>;

  /** Save or update application */
  save(application: Application): Promise<void>;

  /** Delete application */
  delete(id: string): Promise<void>;

  /** Count applications for user */
  countByUserId(userId: string): Promise<number>;
}