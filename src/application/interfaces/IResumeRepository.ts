// src/application/interfaces/IResumeRepository.ts

import { Resume } from "@/domains/resume/entities/Resume";

export interface IResumeRepository {
  /** Find by ID */
  findById(id: string): Promise<Resume | null>;

  /** Find all resumes for a user */
  findByUserId(userId: string): Promise<Resume[]>;

  /** Find default/base resume for user */
  findBaseResumeForUser(userId: string): Promise<Resume | null>;

  /** Create new resume */
  create(resume: Resume): Promise<void>;

  /** Update resume */
  update(resume: Resume): Promise<void>;

  /** Delete resume */
  delete(id: string): Promise<void>;

  /** Set as base resume */
  setAsBase(userId: string, id: string): Promise<void>;

  /** Unset all other base resumes */
  unsetAllBases(userId: string): Promise<void>;
}