import express, { Router } from "express";
import { authRouter } from "./auth.js";

const v1Router: Router = express.Router();

v1Router.use("/auth", authRouter);

export { v1Router };
