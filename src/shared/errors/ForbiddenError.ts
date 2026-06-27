// src/shared/errors/ForbiddenError.ts

import { DomainError } from "./DomainError";

export class ForbiddenError extends DomainError {
  constructor(resourceType?: string) {
    const message = resourceType
      ? `Access forbidden to ${resourceType}`
      : "Access forbidden";

    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}