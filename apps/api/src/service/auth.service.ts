import type { UserModel } from "../generated/prisma/models.js";
import type { PublicUser } from "../types/user.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken, type AccessTokenPayload } from "./jwt.service.js";
import {
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from "./refresh-token.service.js";
import * as userRepository from "../repository/user.repository.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/AppError.js";
import type { RegisterInput, LoginInput } from "../utils/validation.js";
import type { AuthTokens } from "../utils/cookie.js";

export function toPublicUser(user: UserModel): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: UserModel): Promise<AuthTokens> {
  const refreshToken = await createRefreshToken(user.id);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  } satisfies AccessTokenPayload);
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await userRepository.findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError(
      "An account with this email already exists",
      "EMAIL_TAKEN",
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.createUser({
    email: input.email,
    name: input.name ?? null,
    passwordHash,
    provider: "LOCAL",
    emailVerified: false,
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await userRepository.findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }
  if (!user.passwordHash) {
    throw new UnauthorizedError(
      "This account uses Google sign-in. Please sign in with Google.",
      "OAUTH_ACCOUNT",
    );
  }

  const passwordValid = await comparePassword(
    input.password,
    user.passwordHash,
  );
  if (!passwordValid) {
    throw new UnauthorizedError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function loginWithGoogle(googleUser: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  providerId: string;
}) {
  let user = await userRepository.findUserByProvider(
    "GOOGLE",
    googleUser.providerId,
  );

  if (!user) {
    const existingByEmail = await userRepository.findUserByEmail(
      googleUser.email,
    );
    if (existingByEmail) {
      // Google account matches an existing local account: link the provider.
      user = await userRepository.updateUser(existingByEmail.id, {
        provider: "GOOGLE",
        providerId: googleUser.providerId,
        avatarUrl: googleUser.avatarUrl ?? existingByEmail.avatarUrl,
        emailVerified: true,
      });
    } else {
      user = await userRepository.createUser({
        email: googleUser.email,
        name: googleUser.name ?? null,
        avatarUrl: googleUser.avatarUrl ?? null,
        provider: "GOOGLE",
        providerId: googleUser.providerId,
        emailVerified: true,
      });
    }
  }

  const tokens = await issueTokens(user);

  return { user: toPublicUser(user), ...tokens };
}

export async function refreshTokens(refreshToken: string) {
  const { userId } = await validateRefreshToken(refreshToken);
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new UnauthorizedError("User no longer exists", "USER_NOT_FOUND");
  }

  // Rotate: revoke the old token and issue a fresh pair.
  await revokeRefreshToken(refreshToken);
  const newRefreshToken = await createRefreshToken(user.id);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  } satisfies AccessTokenPayload);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: toPublicUser(user),
  };
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    try {
      await validateRefreshToken(refreshToken);
      await revokeRefreshToken(refreshToken);
    } catch {
      // Token already invalid/expired; nothing to revoke.
      return;
    }
  }
}

export async function logoutAll(userId: string) {
  await revokeAllUserRefreshTokens(userId);
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }
  return toPublicUser(user);
}
