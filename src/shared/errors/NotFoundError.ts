// src/shared/errors/NotFoundError.ts

import { DomainError } from "./DomainError";

export class NotFoundError extends DomainError {
  constructor(
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) {
    const message = resourceId
      ? `${resourceType} with id "${resourceId}" not found`
      : `${resourceType} not found`;

    super(message, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }

  static byId(resourceType: string, id: string) {
    return new NotFoundError(resourceType, id);
  }

  static byName(resourceType: string, name: string) {
    return new NotFoundError(resourceType, name, { name });
  }
}