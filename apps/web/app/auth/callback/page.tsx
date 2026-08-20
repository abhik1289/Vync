"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken, useAuth } from "@/app/lib/auth";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      const accessToken = searchParams.get("access_token");
      if (accessToken) {
        setAccessToken(accessToken);
        // Fetch the user profile with the token, refreshing if needed.
        await refresh();
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=google");
      }
    }

    void handleCallback();
  }, [router, searchParams, refresh]);

  return (
    <div className="auth-card" style={{ textAlign: "center" }}>
      <p>Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p>Completing sign in…</p>
        </div>
      }>
      <AuthCallbackInner />
    </Suspense>
  );
}
