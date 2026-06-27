// src/shared/errors/UnauthorizedError.ts

import { DomainError } from "./DomainError";

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}