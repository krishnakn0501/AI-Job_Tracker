// src/domains/user/value-objects/Password.ts

import { ValidationError } from "@/shared/errors/ValidationError";

/**
 * Validates a password against the strong password policy.
 * Returns an error message if the password does not meet the policy,
 * or null if it is valid.
 */
export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 128) {
    return "Password must be at most 128 characters";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
}

/**
 * Immutable value object representing a raw password.
 * Only validates complexity; hashing happens in the infrastructure/service layer.
 */
export class Password {
  private constructor(private readonly _value: string) {}

  static create(password: string): Password {
    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      throw new ValidationError("Password does not meet policy", [
        { field: "password", message: policyError },
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
