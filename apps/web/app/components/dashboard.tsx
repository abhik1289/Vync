"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { ProtectedRoute } from "./protected-route";

export function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <ProtectedRoute>
      <div className="auth-card">
        <h1 className="auth-title">Dashboard</h1>
        <p className="auth-subtitle">You are signed in as</p>

        <div className="dashboard-user">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user?.name ?? user?.email ?? "User"}
              className="dashboard-avatar"
              width={64}
              height={64}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="dashboard-avatar dashboard-avatar-fallback">
              {(user?.name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <dl className="dashboard-details">
            <div>
              <dt>Name</dt>
              <dd>{user?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>
                {user?.provider === "GOOGLE" ? "Google" : "Email & password"}
              </dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>{user?.emailVerified ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="auth-button auth-button-ghost">
          Sign out
        </button>
      </div>
    </ProtectedRoute>
  );
}
