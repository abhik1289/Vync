import type { Metadata } from "next";
import { LoginForm } from "@/app/components/login-form";

export const metadata: Metadata = {
  title: "Sign in | Vync",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <LoginForm />
    </main>
  );
}
