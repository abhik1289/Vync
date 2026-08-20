"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { ApiClientError } from "@/app/lib/api";

const API_URL = "http://localhost:5000";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Sign in to your Vync account</p>

      {error ? <div className="auth-error">{error}</div> : null}

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="email" className="auth-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="you@example.com"
        />

        <label htmlFor="password" className="auth-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          placeholder="••••••••"
        />

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <a
        href={`${API_URL}/api/v1/auth/google`}
        className="auth-button auth-button-google">
        Continue with Google
      </a>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/register">Sign up</Link>
      </p>
    </div>
  );
}
