// src/infrastructure/persistence/prisma/repositories/UserRepository.ts

import { prisma } from "../PrismaClient";
import { UserMapper } from "../mappers/UserMapper";
import { IUserRepository } from "@/application/interfaces/IUserRepository";
import { User } from "@/domains/user/entities/User";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { id } });
    return data ? UserMapper.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return data ? UserMapper.toDomain(data) : null;
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toPrisma(user);
    await prisma.user.create({ data: data as any });
  }

  async update(user: User): Promise<void> {
    const data = UserMapper.toPrisma(user);
    await prisma.user.update({
      where: { id: user.id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}