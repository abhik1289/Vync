import { prisma } from "../config/prisma.js";
import type { AuthProvider } from "../generated/prisma/enums.js";

export interface CreateUserInput {
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  provider?: AuthProvider;
  providerId?: string | null;
  emailVerified?: boolean;
}

export interface UpdateUserInput {
  name?: string | null;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  provider?: AuthProvider;
  providerId?: string | null;
  emailVerified?: boolean;
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByProvider(
  provider: AuthProvider,
  providerId: string,
) {
  return prisma.user.findFirst({ where: { provider, providerId } });
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({ data: input });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return prisma.user.update({ where: { id }, data: input });
}
