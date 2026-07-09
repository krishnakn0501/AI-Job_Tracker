// src/domains/user/entities/User.ts

import { Email } from "../value-objects/Email";
import { Password } from "../value-objects/Password";
import { ValidationError } from "@/shared/errors/ValidationError";
import { Result } from "@/shared/types/Result";
import { randomUUID } from "crypto";

interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  emailVerified: boolean;
  isAdmin: boolean;
  theme: "light" | "dark";
  username?: string;
  dob?: Date;
  country: string;
  mobile?: string;
  pendingEmail?: string;
  // S10 — reminder preferences
  reminderHour: number;
  reminderAmPm: "AM" | "PM";
  reminderOffsetDays: number;
  reminderRepeat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rich domain object representing a JobTrack user.
 * Encapsulates user-related business rules and profile management.
 */
export class User {
  private constructor(private props: UserProps) {}

  /** Create a new user entity from registration data. */
  static create(
    props: Omit<UserProps, "id" | "createdAt" | "updatedAt" | "reminderHour" | "reminderAmPm" | "reminderOffsetDays" | "reminderRepeat">
  ): User {
    const now = new Date();
    return new User({
      ...props,
      id: randomUUID(),
      reminderHour: 9,
      reminderAmPm: "AM",
      reminderOffsetDays: 0,
      reminderRepeat: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Restore a user from database data. */
  static restore(props: UserProps): User {
    return new User(props);
  }

  // ===== Business rules =====

  /** Request an email change. Stores the new email as pending until verified. */
  requestEmailChange(newEmail: string): Result<void, ValidationError> {
    if (newEmail.toLowerCase().trim() === this.props.email.value) {
      return Result.failure(
        new ValidationError("New email must differ from current", [
          { field: "newEmail", message: "Choose a different email address" },
        ])
      );
    }

    try {
      Email.create(newEmail);
    } catch (error) {
      return Result.failure(
        new ValidationError("Invalid email format", [
          { field: "newEmail", message: (error as Error).message },
        ])
      );
    }

    this.props.pendingEmail = newEmail.toLowerCase().trim();
    this.markAsUpdated();
    return Result.success(undefined);
  }

  /** Confirm a pending email change by matching the provided OTP email. */
  confirmPendingEmail(pendingEmailFromOtp: string): Result<void, ValidationError> {
    if (!this.props.pendingEmail) {
      return Result.failure(
        new ValidationError("No pending email change", [
          { field: "otp", message: "There is no pending email change" },
        ])
      );
    }

    if (this.props.pendingEmail !== pendingEmailFromOtp) {
      return Result.failure(
        new ValidationError("Email verification code mismatch", [
          { field: "otp", message: "Code does not match pending email" },
        ])
      );
    }

    this.props.email = Email.create(this.props.pendingEmail);
    this.props.emailVerified = true;
    this.props.pendingEmail = undefined;
    this.markAsUpdated();
    return Result.success(undefined);
  }

  /** Change password after validating the new password meets complexity rules. */
  updatePassword(newPassword: string): Result<void, ValidationError> {
    try {
      Password.create(newPassword);
    } catch (error) {
      return Result.failure(
        new ValidationError("New password doesn't meet requirements", [
          { field: "password", message: (error as Error).message },
        ])
      );
    }
    this.markAsUpdated();
    return Result.success(undefined);
  }

  /** Set the stored password hash directly. Infrastructure layer handles hashing. */
  setPasswordHash(hash: string): void {
    this.props.passwordHash = hash;
    this.markAsUpdated();
  }

  /** Update user profile settings. */
  updateProfile(
    updates: Partial<Pick<UserProps, "username" | "dob" | "country" | "mobile">>
  ): Result<void, ValidationError> {
    if (updates.username && updates.username.length > 50) {
      return Result.failure(
        new ValidationError("Username too long", [
          { field: "username", message: "Maximum 50 characters" },
        ])
      );
    }

    Object.assign(this.props, updates);
    this.markAsUpdated();
    return Result.success(undefined);
  }

  /** Set UI theme preference. */
  setTheme(theme: "light" | "dark"): void {
    this.props.theme = theme;
    this.markAsUpdated();
  }

  /** Update reminder preferences. */
  updateReminderPreferences(preferences: {
    reminderHour?: number;
    reminderAmPm?: "AM" | "PM";
    reminderOffsetDays?: number;
    reminderRepeat?: boolean;
  }): void {
    if (preferences.reminderHour !== undefined) {
      this.props.reminderHour = preferences.reminderHour;
    }
    if (preferences.reminderAmPm !== undefined) {
      this.props.reminderAmPm = preferences.reminderAmPm;
    }
    if (preferences.reminderOffsetDays !== undefined) {
      this.props.reminderOffsetDays = preferences.reminderOffsetDays;
    }
    if (preferences.reminderRepeat !== undefined) {
      this.props.reminderRepeat = preferences.reminderRepeat;
    }
    this.markAsUpdated();
  }

  /** Set admin flag. */
  setAdmin(isAdmin: boolean): void {
    this.props.isAdmin = isAdmin;
    this.markAsUpdated();
  }

  /** Mark email as verified. */
  verifyEmail(): void {
    this.props.emailVerified = true;
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

  get email(): Email {
    return this.props.email;
  }

  get emailValue(): string {
    return this.props.email.value;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  get theme(): "light" | "dark" {
    return this.props.theme;
  }

  get username(): string | undefined {
    return this.props.username;
  }

  get dob(): Date | undefined {
    return this.props.dob;
  }

  get country(): string {
    return this.props.country;
  }

  get mobile(): string | undefined {
    return this.props.mobile;
  }

  get pendingEmail(): string | undefined {
    return this.props.pendingEmail;
  }

  // S10 — Reminder preference accessors
  get reminderHour(): number {
    return this.props.reminderHour;
  }

  get reminderAmPm(): "AM" | "PM" {
    return this.props.reminderAmPm;
  }

  get reminderOffsetDays(): number {
    return this.props.reminderOffsetDays;
  }

  get reminderRepeat(): boolean {
    return this.props.reminderRepeat;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}