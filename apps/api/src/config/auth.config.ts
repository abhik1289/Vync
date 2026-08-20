import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  apiUrl: process.env.API_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret",
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret",
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
} as const;
