import { prisma } from "../config/prisma.js";
import { hashToken } from "../utils/token.js";

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export async function createRefreshToken(input: CreateRefreshTokenInput) {
  return prisma.refreshToken.create({ data: input });
}

export async function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

export async function revokeRefreshToken(tokenHash: string) {
  return prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function deleteExpiredRefreshTokens() {
  return prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

export { hashToken };
