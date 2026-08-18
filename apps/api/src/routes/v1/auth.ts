import express, { Router } from "express";
import { v1Router } from "./index.js";

const authRouter: Router = express.Router();

authRouter.post("/login", (req, res) => {
  // Handle login logic here
  res.json({ message: "Login endpoint reached!" });
});

authRouter.post("/register", (req, res) => {
  // Handle registration logic here
  res.json({ message: "Register endpoint reached!" });
});

export { authRouter };
