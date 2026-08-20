import type { AuthProvider } from "../generated/prisma/enums.js";

/** Shape of a User row as returned by Prisma (scalar fields). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  emailVerified: boolean;
  createdAt: Date;
}
