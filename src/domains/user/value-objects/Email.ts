// src/domains/user/value-objects/Email.ts

import { ValidationError } from "@/shared/errors/ValidationError";

/**
 * Immutable value object representing an email address.
 * Ensures email validity at creation time.
 */
export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    const trimmed = email.toLowerCase().trim();

    // RFC 5322 simplified validation
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isValid) {
      throw new ValidationError("Invalid email format", [
        { field: "email", message: "Must be valid email address" },
      ]);
    }

    return new Email(trimmed);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}