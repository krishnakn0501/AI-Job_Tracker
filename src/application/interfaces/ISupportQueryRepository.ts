// src/application/interfaces/ISupportQueryRepository.ts

import { SupportQuery } from "@/domains/support/entities/SupportQuery";

export interface ISupportQueryRepository {
  /** Find support query by ID */
  findById(id: string): Promise<SupportQuery | null>;

  /** Find all support queries for a user */
  findByUserId(userId: string): Promise<SupportQuery[]>;

  /** Create new support query */
  create(query: SupportQuery): Promise<void>;

  /** Update support query */
  update(query: SupportQuery): Promise<void>;
}