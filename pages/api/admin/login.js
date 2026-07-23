import { isValidPassword, setSessionCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "ADMIN_PASSWORD is not configured on the server" });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  setSessionCookie(res);
  res.status(200).json({ ok: true });
}
