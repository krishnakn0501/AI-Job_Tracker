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
  followUpDone?: boolean;
  interviewDate?: Date;
  interviewDone?: boolean;
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
  // S10 — per-application reminder overrides
  reminderOverrideEnabled?: boolean;
  overrideReminderHour?: number;
  overrideReminderAmPm?: string;
  overrideReminderOffsetDays?: number;
  overrideReminderRepeat?: boolean;
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
    
    // Validate that dates are not before the applied date
    Application.validateDates(props.appliedDate, props.followUpDate, props.interviewDate);

    return new Application({
      ...props,
      id: randomUUID(),
      roleTitleChanged: props.roleTitleChanged ?? false,
      reminderOverrideEnabled: props.reminderOverrideEnabled ?? false,
      overrideReminderHour: props.overrideReminderHour,
      overrideReminderAmPm: props.overrideReminderAmPm,
      overrideReminderOffsetDays: props.overrideReminderOffsetDays,
      overrideReminderRepeat: props.overrideReminderRepeat,
      followUpDone: props.followUpDone ?? false,
      interviewDone: props.interviewDone ?? false,
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

  // ===== Reminder overrides =====

  /** Update per-application reminder override settings. */
  updateReminderOverride(override: {
    reminderOverrideEnabled?: boolean;
    overrideReminderHour?: number | null;
    overrideReminderAmPm?: string | null;
    overrideReminderOffsetDays?: number | null;
    overrideReminderRepeat?: boolean | null;
  }): void {
    if (override.reminderOverrideEnabled !== undefined) {
      this.props.reminderOverrideEnabled = override.reminderOverrideEnabled;
    }
    if (override.overrideReminderHour !== undefined) {
      this.props.overrideReminderHour = override.overrideReminderHour ?? undefined;
    }
    if (override.overrideReminderAmPm !== undefined) {
      this.props.overrideReminderAmPm = override.overrideReminderAmPm ?? undefined;
    }
    if (override.overrideReminderOffsetDays !== undefined) {
      this.props.overrideReminderOffsetDays = override.overrideReminderOffsetDays ?? undefined;
    }
    if (override.overrideReminderRepeat !== undefined) {
      this.props.overrideReminderRepeat = override.overrideReminderRepeat ?? undefined;
    }
    this.markAsUpdated();
  }

  // ===== Follow-up scheduling =====

  /** Schedule follow-up reminder relative to interview date (7 days before). */
  scheduleFollowUp(interviewDate?: Date): void {
    if (interviewDate) {
      const sevenDaysBefore = new Date(interviewDate);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      
      // Ensure the scheduled follow-up is not before the applied date
      const applied = new Date(this.props.appliedDate);
      applied.setHours(0, 0, 0, 0);
      
      const scheduled = new Date(sevenDaysBefore);
      scheduled.setHours(0, 0, 0, 0);
      
      if (scheduled < applied) {
        this.props.followUpDate = this.props.appliedDate; // fallback to applied date
      } else {
        this.props.followUpDate = sevenDaysBefore;
      }
    }
  }

  // ===== General update =====
  
  /** Update application mutable dates */
  updateDates(followUpDate?: Date | null, interviewDate?: Date | null): void {
    Application.validateDates(
      this.props.appliedDate, 
      followUpDate ?? undefined, 
      interviewDate ?? undefined
    );
    
    if (followUpDate !== undefined) this.props.followUpDate = followUpDate ?? undefined;
    if (interviewDate !== undefined) this.props.interviewDate = interviewDate ?? undefined;
    
    this.markAsUpdated();
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

  private static validateDates(appliedDate: Date, followUpDate?: Date, interviewDate?: Date): void {
    const applied = new Date(appliedDate);
    applied.setHours(0, 0, 0, 0);
    
    if (followUpDate) {
      const followUp = new Date(followUpDate);
      followUp.setHours(0, 0, 0, 0);
      if (followUp < applied) {
        throw new ValidationError("Follow-up date cannot be before applied date");
      }
    }
    
    if (interviewDate) {
      const interview = new Date(interviewDate);
      interview.setHours(0, 0, 0, 0);
      if (interview < applied) {
        throw new ValidationError("Interview date cannot be before applied date");
      }
    }
  }

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

  get followUpDone(): boolean {
    return this.props.followUpDone ?? false;
  }

  get interviewDate(): Date | undefined {
    return this.props.interviewDate;
  }

  get interviewDone(): boolean {
    return this.props.interviewDone ?? false;
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

  // S10 — Reminder override accessors
  get reminderOverrideEnabled(): boolean {
    return this.props.reminderOverrideEnabled ?? false;
  }

  get overrideReminderHour(): number | undefined {
    return this.props.overrideReminderHour;
  }

  get overrideReminderAmPm(): string | undefined {
    return this.props.overrideReminderAmPm;
  }

  get overrideReminderOffsetDays(): number | undefined {
    return this.props.overrideReminderOffsetDays;
  }

  get overrideReminderRepeat(): boolean | undefined {
    return this.props.overrideReminderRepeat;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}