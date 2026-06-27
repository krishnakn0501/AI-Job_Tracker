// src/domains/support/entities/SupportQuery.ts

import { ValidationError } from "@/shared/errors/ValidationError";
import { Result } from "@/shared/types/Result";
import { randomUUID } from "crypto";

export enum SupportQueryStatus {
  Open = "open",
  Resolved = "resolved",
}

export enum SupportQueryCategory {
  BugReport = "Bug Report",
  FeatureRequest = "Feature Request",
  General = "General",
}

interface SupportQueryProps {
  id: string;
  userId: string;
  category: SupportQueryCategory;
  message: string;
  status: SupportQueryStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rich domain object representing a support query ticket.
 */
export class SupportQuery {
  private constructor(private props: SupportQueryProps) {}

  /** Create a new support query. */
  static create(
    props: Omit<SupportQueryProps, "id" | "status" | "createdAt" | "updatedAt">
  ): SupportQuery {
    const now = new Date();
    return new SupportQuery({
      ...props,
      id: randomUUID(),
      status: SupportQueryStatus.Open,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Restore a support query from database data. */
  static restore(props: SupportQueryProps): SupportQuery {
    return new SupportQuery(props);
  }

  // ===== Business rules =====

  /** Resolve the support query. */
  resolve(): Result<void, ValidationError> {
    if (this.props.status === SupportQueryStatus.Resolved) {
      return Result.failure(new ValidationError("Query already resolved"));
    }

    this.props.status = SupportQueryStatus.Resolved;
    this.markAsUpdated();
    return Result.success(undefined);
  }

  /** Re-open a resolved query. */
  reopen(): Result<void, ValidationError> {
    if (this.props.status === SupportQueryStatus.Open) {
      return Result.failure(new ValidationError("Query already open"));
    }

    this.props.status = SupportQueryStatus.Open;
    this.markAsUpdated();
    return Result.success(undefined);
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

  get category(): SupportQueryCategory {
    return this.props.category;
  }

  get message(): string {
    return this.props.message;
  }

  get status(): SupportQueryStatus {
    return this.props.status;
  }

  get isOpen(): boolean {
    return this.props.status === SupportQueryStatus.Open;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}