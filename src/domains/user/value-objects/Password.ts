// src/domains/user/value-objects/Password.ts

import { ValidationError } from "@/shared/errors/ValidationError";

/**
 * Immutable value object representing a raw password.
 * Only validates complexity; hashing happens in the infrastructure/service layer.
 */
export class Password {
  private constructor(private readonly _value: string) {}

  static create(password: string): Password {
    if (password.length < 8) {
      throw new ValidationError("Password too short", [
        { field: "password", message: "Minimum 8 characters required" },
      ]);
    }

    if (password.length > 128) {
      throw new ValidationError("Password too long", [
        { field: "password", message: "Maximum 128 characters allowed" },
      ]);
    }

    return new Password(password);
  }

  /**
   * Exposes the raw password only for the hashing step.
   * Never return this in logs, DTOs, or responses.
   */
  get value(): string {
    return this._value;
  }
}