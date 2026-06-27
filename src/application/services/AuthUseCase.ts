// src/application/services/AuthUseCase.ts

import { IUserRepository } from "../interfaces/IUserRepository";
import { User } from "@/domains/user/entities/User";
import { Email } from "@/domains/user/value-objects/Email";
import { Password } from "@/domains/user/value-objects/Password";
import { Result } from "@/shared/types/Result";
import { ValidationError } from "@/shared/errors/ValidationError";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { ForbiddenError } from "@/shared/errors/ForbiddenError";
import { prisma } from "@/infrastructure/persistence/prisma/PrismaClient";

import { hashPassword, verifyPassword } from "@/infrastructure/auth/PasswordService";
import { signJwt } from "@/infrastructure/auth/JwtService";
import {
  generateOtp as generateOtpCode,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
} from "@/infrastructure/auth/OtpService";
import { sendOtpEmail } from "@/infrastructure/email/MailerService";

interface AuthToken {
  token: string;
  isAdmin: boolean;
}

export type OtpPurpose = "signup" | "reset_password" | "change_email";

export class AuthUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  // ===== Signup / Login =====

  async signUp(
    email: string,
    password: string
  ): Promise<Result<{ userId: string; isExistingUnverified: boolean }>> {
    try {
      const emailVo = Email.create(email);
      Password.create(password);

      let userId: string;
      let isExistingUnverified: boolean;

      const existing = await this.userRepository.findByEmail(emailVo.value);
      if (existing) {
        if (existing.emailVerified) {
          return Result.failure(
            new ValidationError("Email already registered", [
              { field: "email", message: "An account with this email already exists" },
            ])
          );
        }
        const passwordHash = await hashPassword(password);
        existing.setPasswordHash(passwordHash);
        await this.userRepository.update(existing);
        userId = existing.id;
        isExistingUnverified = true;
      } else {
        const passwordHash = await hashPassword(password);
        const user = User.create({
          email: emailVo,
          passwordHash,
          emailVerified: false,
          isAdmin: false,
          theme: "light",
          country: "India",
        });

        await this.userRepository.create(user);
        userId = user.id;
        isExistingUnverified = false;
      }

      // Create signup OTP and send email
      const code = generateOtpCode();
      await prisma.otpCode.create({
        data: {
          userId,
          code,
          purpose: "signup",
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
      });
      sendOtpEmail(emailVo.value, code, "signup");

      return Result.success({ userId, isExistingUnverified });
    } catch (error) {
      if (error instanceof ValidationError) {
        return Result.failure(error);
      }
      return Result.failure(error as Error);
    }
  }

  async login(email: string, password: string): Promise<Result<AuthToken>> {
    try {
      Email.create(email);
    } catch {
      return Result.failure(new UnauthorizedError("Invalid email or password"));
    }

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.failure(new UnauthorizedError("Invalid email or password"));
    }

    if (!user.emailVerified) {
      return Result.failure(
        new ForbiddenError("Please verify your email before logging in")
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return Result.failure(new UnauthorizedError("Invalid email or password"));
    }

    const token = await signJwt({ userId: user.id, email: user.emailValue });
    return Result.success({ token, isAdmin: user.isAdmin });
  }

  // ===== Password Reset =====

  async forgotPassword(email: string): Promise<Result<{ userId?: string }>> {
    try {
      Email.create(email);
    } catch {
      // Don't leak whether email exists
      return Result.success({});
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Result.success({});
    }

    const code = generateOtpCode();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        purpose: "reset_password",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    sendOtpEmail(user.emailValue, code, "reset_password");
    return Result.success({ userId: user.id });
  }

  async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<Result<void>> {
    try {
      Password.create(newPassword);
    } catch (error) {
      return Result.failure(
        new ValidationError("New password doesn't meet requirements", [
          { field: "password", message: (error as Error).message },
        ])
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.failure(new UnauthorizedError("User not found"));
    }

    const passwordHash = await hashPassword(newPassword);
    user.setPasswordHash(passwordHash);
    await this.userRepository.update(user);

    return Result.success(undefined);
  }

  // ===== Change Password =====

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<Result<void>> {
    try {
      Password.create(newPassword);
    } catch (error) {
      return Result.failure(
        new ValidationError("New password doesn't meet requirements", [
          { field: "password", message: (error as Error).message },
        ])
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.failure(new UnauthorizedError("User not found"));
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return Result.failure(new UnauthorizedError("Current password is incorrect"));
    }

    const passwordHash = await hashPassword(newPassword);
    user.setPasswordHash(passwordHash);
    await this.userRepository.update(user);

    return Result.success(undefined);
  }

  // ===== Email Change =====

  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string
  ): Promise<Result<{ userId: string; code: string }>> {
    let emailVo: Email;
    try {
      emailVo = Email.create(newEmail);
    } catch (error) {
      return Result.failure(
        new ValidationError("Invalid email format", [
          { field: "newEmail", message: (error as Error).message },
        ])
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.failure(new UnauthorizedError("User not found"));
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return Result.failure(new UnauthorizedError("Current password is incorrect"));
    }

    const taken = await this.userRepository.findByEmail(emailVo.value);
    if (taken) {
      return Result.failure(
        new ValidationError("That email is already in use", [
          { field: "newEmail", message: "Choose another email address" },
        ])
      );
    }

    const requestResult = user.requestEmailChange(newEmail);
    if (requestResult.error) {
      return Result.failure(requestResult.error);
    }

    await this.userRepository.update(user);

    const code = generateOtpCode();
    await prisma.otpCode.create({
      data: {
        userId,
        code,
        purpose: "change_email",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    sendOtpEmail(newEmail, code, "change_email");

    return Result.success({ userId, code });
  }

  // ===== OTP Verification =====

  async verifyOtp(
    userId: string,
    code: string,
    purpose: OtpPurpose
  ): Promise<Result<{ purpose: OtpPurpose; email?: string; userId: string }>> {
    const otp = await prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return Result.failure(new ValidationError("No active code found. Request a new one."));
    }
    if (otp.expiresAt < new Date()) {
      return Result.failure(new ValidationError("Code expired. Request a new one."));
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return Result.failure(new ValidationError("Too many attempts. Request a new code."));
    }
    if (otp.code !== code) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return Result.failure(new ValidationError("Incorrect code"));
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.failure(new UnauthorizedError("User not found"));
    }

    if (purpose === "change_email") {
      const confirmResult = user.confirmPendingEmail(user.pendingEmail ?? "");
      if (confirmResult.error) {
        return Result.failure(confirmResult.error);
      }
      await this.userRepository.update(user);
      return Result.success({ purpose, email: user.emailValue, userId });
    }

    // signup / reset_password — no extra state change needed here
    return Result.success({ purpose, userId });
  }

  // ===== Resend OTP =====

  async resendOtp(
    userId: string,
    purpose: OtpPurpose
  ): Promise<Result<{ userId: string; code: string }>> {
    const lastOtp = await prisma.otpCode.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: "desc" },
    });

    if (
      lastOtp &&
      Date.now() - lastOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const waitMs =
        OTP_RESEND_COOLDOWN_MS - (Date.now() - lastOtp.createdAt.getTime());
      return Result.failure(
        new ValidationError(`Please wait ${Math.ceil(waitMs / 1000)}s before resending`)
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.failure(new UnauthorizedError("User not found"));
    }

    const code = generateOtpCode();
    await prisma.otpCode.create({
      data: {
        userId,
        code,
        purpose,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    sendOtpEmail(user.emailValue, code, purpose);

    return Result.success({ userId, code });
  }
}
