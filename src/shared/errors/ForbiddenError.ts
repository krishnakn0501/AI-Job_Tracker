// src/shared/errors/ForbiddenError.ts

import { DomainError } from "./DomainError";

export class ForbiddenError extends DomainError {
  constructor(message?: string) {
    super(message || "Access forbidden", "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}