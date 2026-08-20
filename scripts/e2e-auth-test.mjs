// E2E auth tests using Node's built-in fetch
const BASE = "http://localhost:5000";

async function req(path, { method = "GET", headers = {}, body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

function extractToken(setCookie) {
  const m = /vync_refresh_token=([^;]+)/.exec(setCookie ?? "");
  return m ? m[1] : null;
}

async function main() {
  const email = `e2e-${Date.now()}@vync.dev`;

  // 1. Register
  let r = await req("/api/v1/auth/register", {
    method: "POST",
    body: { email, password: "Passw0rd123", name: "E2E User" },
  });
  console.log(
    "1. Register:",
    r.status,
    r.json?.success === true ? "OK" : "FAIL",
    r.json?.error?.code ?? "",
  );

  // 2. Login + capture refresh cookie
  r = await req("/api/v1/auth/login", {
    method: "POST",
    body: { email, password: "Passw0rd123" },
  });
  const accessToken = r.json?.data?.accessToken;
  const oldRefresh = extractToken(r.setCookie);
  console.log(
    "2. Login:",
    r.status,
    accessToken ? "OK (access token issued)" : "FAIL",
  );

  // 3. /me with access token
  r = await req("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(
    "3. /me with token:",
    r.status,
    r.json?.data?.user?.email === email ? "OK" : "FAIL",
  );

  // 4. Refresh rotates the token
  r = await req("/api/v1/auth/refresh", {
    method: "POST",
    cookie: `vync_refresh_token=${oldRefresh}`,
  });
  const newRefresh = extractToken(r.setCookie);
  console.log(
    "4. Refresh:",
    r.status,
    r.json?.data?.accessToken ? "OK (rotated)" : "FAIL",
  );

  // 5. REUSE of old refresh token must be rejected
  r = await req("/api/v1/auth/refresh", {
    method: "POST",
    cookie: `vync_refresh_token=${oldRefresh}`,
  });
  console.log(
    "5. Old token reuse:",
    r.status === 401
      ? `OK (blocked ${r.json?.error?.code})`
      : `FAIL (got ${r.status})`,
  );

  // 6. New token still works (chain intact)
  r = await req("/api/v1/auth/refresh", {
    method: "POST",
    cookie: `vync_refresh_token=${newRefresh}`,
  });
  console.log(
    "6. New token works:",
    r.status === 200 ? "OK" : `FAIL (got ${r.status})`,
  );

  // 7. Wrong password rejected
  r = await req("/api/v1/auth/login", {
    method: "POST",
    body: { email, password: "WrongPass1" },
  });
  console.log(
    "7. Wrong password:",
    r.status === 401
      ? `OK (blocked ${r.json?.error?.code})`
      : `FAIL (got ${r.status})`,
  );

  // 8. Duplicate email rejected
  r = await req("/api/v1/auth/register", {
    method: "POST",
    body: { email, password: "Passw0rd123" },
  });
  console.log(
    "8. Duplicate email:",
    r.status === 409
      ? `OK (blocked ${r.json?.error?.code})`
      : `FAIL (got ${r.status})`,
  );

  // 9. /me without token rejected
  r = await req("/api/v1/auth/me");
  console.log(
    "9. /me no token:",
    r.status === 401
      ? `OK (blocked ${r.json?.error?.code})`
      : `FAIL (got ${r.status})`,
  );

  // 10. Logout revokes the refresh token
  r = await req("/api/v1/auth/login", {
    method: "POST",
    body: { email, password: "Passw0rd123" },
  });
  const logoutRefresh = extractToken(r.setCookie);
  const logoutAccess = r.json?.data?.accessToken;
  r = await req("/api/v1/auth/logout", {
    method: "POST",
    cookie: `vync_refresh_token=${logoutRefresh}`,
    headers: { Authorization: `Bearer ${logoutAccess}` },
  });
  console.log(
    "10. Logout:",
    r.status === 200 ? "OK" : `FAIL (got ${r.status})`,
  );
  r = await req("/api/v1/auth/refresh", {
    method: "POST",
    cookie: `vync_refresh_token=${logoutRefresh}`,
  });
  console.log(
    "11. Refresh after logout:",
    r.status === 401 ? "OK (revoked)" : `FAIL (got ${r.status})`,
  );

  console.log("\nALL E2E CHECKS DONE");
}

main().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
