// src/domains/application/value-objects/JobDescription.ts

import { ValidationError } from "@/shared/errors/ValidationError";

/**
 * Value object representing a parsed job description.
 */
export class JobDescription {
  private constructor(
    public readonly text: string,
    public readonly url?: string
  ) {}

  static fromText(text: string, url?: string): JobDescription {
    const trimmed = text.trim();

    if (!trimmed) {
      throw new ValidationError("Job description cannot be empty", [
        { field: "jdText", message: "Job description text is required" },
      ]);
    }

    return new JobDescription(trimmed, url);
  }

  /**
   * Approximate word count for the job description.
   */
  get wordCount(): number {
    return this.text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Returns true if the JD appears to contain role/company details.
   */
  isMeaningful(): boolean {
    return this.wordCount >= 10;
  }
}