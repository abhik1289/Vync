import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { authConfig } from "../config/auth.config.js";
import { login, loginWithGoogle } from "../service/auth.service.js";

type Done = (error: Error | null, user?: Express.User | false) => void;

if (!authConfig.google.clientId || !authConfig.google.clientSecret) {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. Google login will be unavailable.",
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: authConfig.google.clientId,
      clientSecret: authConfig.google.clientSecret,
      callbackURL: `http://localhost:5000/api/v1/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: Done,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google account has no email address"));
        }

        const result = await loginWithGoogle({
          email,
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value ?? null,
          providerId: profile.id,
        });

        return done(null, {
          ...result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        } satisfies Express.User);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email: string, password: string, done: Done) => {
      try {
        const result = await login({ email, password });
        return done(null, {
          ...result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        } satisfies Express.User);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
