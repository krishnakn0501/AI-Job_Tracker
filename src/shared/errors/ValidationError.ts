// src/shared/errors/ValidationError.ts

import { DomainError } from "./DomainError";

interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    issues: ValidationIssue[] = [],
    details?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", { ...details, issues });
    this.name = "ValidationError";
  }

  getFields(): string[] {
    const issues = this.details?.issues as ValidationIssue[] | undefined;
    return issues?.map((i: ValidationIssue) => i.field) ?? [];
  }

  getFieldErrors(field: string): string[] {
    const issues = this.details?.issues as ValidationIssue[] | undefined;
    return issues?.filter((i) => i.field === field).map((i) => i.message) ?? [];
  }
}