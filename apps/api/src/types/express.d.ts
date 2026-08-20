import type { PublicUser } from "../types/user.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Augment the empty interface from @types/passport so strategy
    // verify callbacks can pass our auth result.
    interface User extends PublicUser {
      accessToken?: string;
      refreshToken?: string;
    }
  }
}

export {};
