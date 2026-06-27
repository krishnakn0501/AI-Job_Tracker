// src/domains/application/entities/Application.ts

import {
  ApplicationStatus,
  isValidTransition,
  getValidNextStatuses as getNextStatuses,
} from "./ApplicationStatus";
import { JobDescription } from "../value-objects/JobDescription";
import { ValidationError } from "@/shared/errors/ValidationError";
import { randomUUID } from "crypto";

interface ApplicationProps {
  id: string;
  userId: string;
  company: string;
  role: string;
  jdText?: string;
  jdUrl?: string;
  status: ApplicationStatus;
  appliedDate: Date;
  followUpDate?: Date;
  interviewDate?: Date;
  generationStatus: string;
  resumeMarkdown?: string;
  coverLetterMarkdown?: string;
  resumeReviewPath?: string;
  resumeFinalPath?: string;
  coverLetterReviewPath?: string;
  coverLetterFinalPath?: string;
  roleTitleChanged?: boolean;
  roleTitleNote?: string;
  notes?: string;
  resumeBaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rich domain object representing a job application.
 * Encapsulates status transition rules, follow-up scheduling, and generation lifecycle.
 */
export class Application {
  private constructor(private props: ApplicationProps) {}

  /** Create a new application entity. */
  static create(
    props: Omit<ApplicationProps, "id" | "createdAt" | "updatedAt">
  ): Application {
    const now = new Date();
    return new Application({
      ...props,
      id: randomUUID(),
      roleTitleChanged: props.roleTitleChanged ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Restore an application from database data. */
  static restore(props: ApplicationProps): Application {
    return new Application(props);
  }

  // ===== Status transitions =====

  /** Check if a status transition is allowed. */
  canTransitionTo(newStatus: ApplicationStatus): boolean {
    return isValidTransition(this.props.status, newStatus);
  }

  /** Update status with business rule validation. */
  updateStatus(newStatus: ApplicationStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${this.props.status} to ${newStatus}`,
        [
          {
            field: "status",
            message: `Allowed transitions from ${this.props.status}: ${this.getValidNextStatuses().join(
              ", "
            )}`,
          },
        ]
      );
    }

    this.props.status = newStatus;

    // Terminal statuses clear follow-up date
    if (
      newStatus === ApplicationStatus.Offer ||
      newStatus === ApplicationStatus.Rejected
    ) {
      this.props.followUpDate = undefined;
    }

    this.markAsUpdated();
  }

  /** Get the list of statuses this application can move to. */
  getValidNextStatuses(): ApplicationStatus[] {
    return getNextStatuses(this.props.status);
  }

  // ===== Job description =====

  /** Extract and validate the job description text. */
  extractJobDescription(): JobDescription | null {
    if (!this.props.jdText?.trim()) {
      return null;
    }

    try {
      return JobDescription.fromText(this.props.jdText, this.props.jdUrl);
    } catch {
      return null;
    }
  }

  // ===== Resume linking =====

  /** Link this application to a resume base. */
  linkResume(resumeBaseId: string): void {
    this.props.resumeBaseId = resumeBaseId;
    this.markAsUpdated();
  }

  // ===== Follow-up scheduling =====

  /** Schedule follow-up reminder relative to interview date (7 days before). */
  scheduleFollowUp(interviewDate?: Date): void {
    if (interviewDate) {
      const sevenDaysBefore = new Date(interviewDate);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      this.props.followUpDate = sevenDaysBefore;
    }
  }

  // ===== Generation lifecycle =====

  markGenerationStarted(): void {
    this.props.generationStatus = "generating";
    this.markAsUpdated();
  }

  markGenerationCompleted(): void {
    this.props.generationStatus = "completed";
    this.markAsUpdated();
  }

  markGenerationFailed(reason?: string): void {
    this.props.generationStatus = reason ? `failed:${reason}` : "failed";
    this.markAsUpdated();
  }

  isGenerationComplete(): boolean {
    return this.props.generationStatus === "completed";
  }

  // ===== Internal =====

  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ===== Read-only accessors =====

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get company(): string {
    return this.props.company;
  }

  get role(): string {
    return this.props.role;
  }

  get jdText(): string | undefined {
    return this.props.jdText;
  }

  get jdUrl(): string | undefined {
    return this.props.jdUrl;
  }

  get status(): ApplicationStatus {
    return this.props.status;
  }

  get appliedDate(): Date {
    return this.props.appliedDate;
  }

  get followUpDate(): Date | undefined {
    return this.props.followUpDate;
  }

  get interviewDate(): Date | undefined {
    return this.props.interviewDate;
  }

  get generationStatus(): string {
    return this.props.generationStatus;
  }

  get resumeMarkdown(): string | undefined {
    return this.props.resumeMarkdown;
  }

  get coverLetterMarkdown(): string | undefined {
    return this.props.coverLetterMarkdown;
  }

  get resumeReviewPath(): string | undefined {
    return this.props.resumeReviewPath;
  }

  get resumeFinalPath(): string | undefined {
    return this.props.resumeFinalPath;
  }

  get coverLetterReviewPath(): string | undefined {
    return this.props.coverLetterReviewPath;
  }

  get coverLetterFinalPath(): string | undefined {
    return this.props.coverLetterFinalPath;
  }

  get roleTitleChanged(): boolean {
    return this.props.roleTitleChanged ?? false;
  }

  get roleTitleNote(): string | undefined {
    return this.props.roleTitleNote;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get resumeBaseId(): string | undefined {
    return this.props.resumeBaseId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}