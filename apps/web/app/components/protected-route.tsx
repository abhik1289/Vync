"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";

export function ProtectedRoute({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return fallback;
  }

  return <>{children}</>;
}
