import express, { Router } from "express";
import passport from "../../strategies/passport.js";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  meHandler,
} from "../../controllers/auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "../../utils/validation.js";
import { authConfig } from "../../config/auth.config.js";
import { setRefreshTokenCookie } from "../../utils/cookie.js";

const authRouter: Router = express.Router();

authRouter.post("/register", validateBody(registerSchema), registerHandler);

authRouter.post("/login", validateBody(loginSchema), loginHandler);

authRouter.post("/refresh", refreshHandler);

authRouter.post("/logout", authenticate, logoutHandler);

authRouter.post("/logout-all", authenticate, logoutAllHandler);

authRouter.get("/me", authenticate, meHandler);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=google",
  }),
  (req, res) => {
    const result = req.user as Express.User & {
      accessToken: string;
      refreshToken: string;
    };

    console.log("Google login successful");
    console.log(req.user);

    // Set the refresh token as an httpOnly cookie so the web app can
    // transparently rotate it via the /refresh endpoint, and hand the
    // short-lived access token back via the URL for the client to store.
    setRefreshTokenCookie(res, result.refreshToken);
    res.cookie("acees_token", req.user?.accessToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });
    res.cookie("acees_token", req.user?.refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 60 * 7 * 1000), // 7 days
    });
    // const redirectUrl = new URL("/auth/callback", authConfig.clientUrl);
    // redirectUrl.searchParams.set("access_token", result.accessToken);
    return res.redirect(`${authConfig.clientUrl}/dashboard`);
  },
);

export { authRouter };
