// src/application/services/UserUseCase.ts

import { IUserRepository } from "../interfaces/IUserRepository";
import { UserDto, UpdateUserProfileInput } from "../dtos/UserDto";
import { Result } from "@/shared/types/Result";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ValidationError } from "@/shared/errors/ValidationError";

export class UserUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async getById(id: string): Promise<Result<UserDto>> {
    const user = await this.repository.findById(id);

    if (!user) {
      return Result.failure(new NotFoundError("User", id));
    }

    return Result.success(this.toDto(user));
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput
  ): Promise<Result<UserDto>> {
    const user = await this.repository.findById(id);

    if (!user) {
      return Result.failure(new NotFoundError("User", id));
    }

    const result = user.updateProfile({
      username: input.username,
      dob: input.dob ? new Date(input.dob) : undefined,
      country: input.country,
      mobile: input.mobile,
    });

    if (result.error) {
      return result;
    }

    if (input.theme) {
      user.setTheme(input.theme);
    }

    // S10 — reminder preferences
    if (
      input.reminderHour !== undefined ||
      input.reminderAmPm !== undefined ||
      input.reminderOffsetDays !== undefined ||
      input.reminderRepeat !== undefined
    ) {
      user.updateReminderPreferences({
        reminderHour: input.reminderHour,
        reminderAmPm: input.reminderAmPm,
        reminderOffsetDays: input.reminderOffsetDays,
        reminderRepeat: input.reminderRepeat,
      });
    }

    await this.repository.update(user);
    return Result.success(this.toDto(user));
  }

  async setTheme(id: string, theme: "light" | "dark"): Promise<Result<UserDto>> {
    const user = await this.repository.findById(id);

    if (!user) {
      return Result.failure(new NotFoundError("User", id));
    }

    user.setTheme(theme);
    await this.repository.update(user);
    return Result.success(this.toDto(user));
  }

  async verifyEmail(id: string): Promise<Result<UserDto>> {
    const user = await this.repository.findById(id);

    if (!user) {
      return Result.failure(new NotFoundError("User", id));
    }

    user.verifyEmail();
    await this.repository.update(user);
    return Result.success(this.toDto(user));
  }

  private toDto(user: {
    id: string;
    emailValue: string;
    emailVerified: boolean;
    isAdmin: boolean;
    theme: "light" | "dark";
    username?: string;
    dob?: Date;
    country: string;
    mobile?: string;
    pendingEmail?: string;
    // S10
    reminderHour: number;
    reminderAmPm: "AM" | "PM";
    reminderOffsetDays: number;
    reminderRepeat: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserDto {
    return {
      id: user.id,
      email: user.emailValue,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
      theme: user.theme,
      username: user.username,
      dob: user.dob?.toISOString(),
      country: user.country,
      mobile: user.mobile,
      pendingEmail: user.pendingEmail,
      // S10
      reminderHour: user.reminderHour,
      reminderAmPm: user.reminderAmPm,
      reminderOffsetDays: user.reminderOffsetDays,
      reminderRepeat: user.reminderRepeat,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}