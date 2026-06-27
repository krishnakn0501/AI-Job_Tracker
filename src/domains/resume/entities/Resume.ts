// src/domains/resume/entities/Resume.ts

import { ResumeLabel } from "../value-objects/ResumeLabel";
import { ValidationError } from "@/shared/errors/ValidationError";
import { randomUUID } from "crypto";

interface ResumeProps {
  id: string;
  userId: string;
  fileId: string;
  filename: string;
  label: ResumeLabel;
  isBase: boolean;
  content?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rich domain object representing a user's uploaded resume.
 * Enforces label validation and base-resume selection rules.
 */
export class Resume {
  private constructor(private props: ResumeProps) {}

  /** Create a new resume entity. */
  static create(
    props: Omit<ResumeProps, "id" | "createdAt" | "updatedAt">
  ): Resume {
    const now = new Date();
    return new Resume({
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Restore a resume from database data. */
  static restore(props: ResumeProps): Resume {
    return new Resume(props);
  }

  // ===== Business rules =====

  /** Update the resume label with validation. */
  updateLabel(newLabel: string): void {
    try {
      this.props.label = ResumeLabel.create(newLabel);
    } catch (error) {
      throw new ValidationError("Invalid resume label", [
        { field: "label", message: (error as Error).message },
      ]);
    }
    this.markAsUpdated();
  }

  /** Mark as the user's default/base resume. */
  setAsBase(isBase: boolean): void {
    this.props.isBase = isBase;
    this.markAsUpdated();
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

  get fileId(): string {
    return this.props.fileId;
  }

  get filename(): string {
    return this.props.filename;
  }

  get label(): string {
    return this.props.label.value;
  }

  get isBase(): boolean {
    return this.props.isBase;
  }

  get content(): Record<string, unknown> | undefined {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}