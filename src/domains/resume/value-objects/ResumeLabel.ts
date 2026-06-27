// src/domains/resume/value-objects/ResumeLabel.ts

import { ValidationError } from "@/shared/errors/ValidationError";

/**
 * Value object representing a resume label.
 */
export class ResumeLabel {
  private constructor(public readonly value: string) {}

  static create(label: string): ResumeLabel {
    const trimmed = label.trim();

    if (!trimmed) {
      throw new ValidationError("Resume label cannot be empty", [
        { field: "label", message: "Label is required" },
      ]);
    }

    if (trimmed.length > 50) {
      throw new ValidationError("Resume label too long", [
        { field: "label", message: "Maximum 50 characters allowed" },
      ]);
    }

    return new ResumeLabel(trimmed);
  }

  equals(other: ResumeLabel): boolean {
    return this.value === other.value;
  }
}