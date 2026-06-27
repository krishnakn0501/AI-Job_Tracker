// src/application/interfaces/IUserRepository.ts

import { User } from "@/domains/user/entities/User";

export interface IUserRepository {
  /** Find by ID */
  findById(id: string): Promise<User | null>;

  /** Find by email (for login/signup) */
  findByEmail(email: string): Promise<User | null>;

  /** Check if email exists */
  emailExists(email: string): Promise<boolean>;

  /** Create new user */
  create(user: User): Promise<void>;

  /** Update existing user */
  update(user: User): Promise<void>;

  /** Delete user (with cascade) */
  delete(id: string): Promise<void>;
}