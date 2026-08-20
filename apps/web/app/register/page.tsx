import type { Metadata } from "next";
import { RegisterForm } from "@/app/components/register-form";

export const metadata: Metadata = {
  title: "Create account | Vync",
};

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <RegisterForm />
    </main>
  );
}
