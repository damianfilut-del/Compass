import crypto from "crypto";

const COOKIE_NAME = "taib_admin_session";

function getSecret() {
  return process.env.ADMIN_PASSWORD || "dev-only-insecure-secret";
}

export function makeSessionToken() {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update("taib-admin-session").digest("hex");
}

export function isValidPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export function setSessionCookie(res) {
  const token = makeSessionToken();
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + 60 * 60 * 24 * 30,
  ];
  if (isProd) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = val;
  });
  return out;
}

export function isAdminRequest(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  return token === makeSessionToken();
}

export { COOKIE_NAME };
