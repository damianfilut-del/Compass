import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "שגיאת התחברות");
      }
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand"><b>מצפן טייב לחינוך</b>כניסת מנהל</div>
      </div>
      <form className="card" onSubmit={handleSubmit}>
        <h2>התחברות</h2>
        <div className="field">
          <label>סיסמת מנהל</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="btn" type="submit" disabled={loading || !password}>
          {loading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}
