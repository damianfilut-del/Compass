import { useEffect, useState } from "react";
import { CONTENT, ALL_MOIS } from "../../lib/content";
import { isAdminRequest } from "../../lib/auth";

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }
  return { props: {} };
}

function computeScores(responses) {
  const perMoi = {};
  ALL_MOIS.forEach((m) => {
    const vals = responses.map((r) => r.answers[m.id]).filter((v) => v && v.score).map((v) => v.score);
    perMoi[m.id] = {
      values: vals,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      divergent: vals.length > 1 && Math.max(...vals) - Math.min(...vals) > 1,
    };
  });
  const perPrinciple = {};
  CONTENT.principles.forEach((p) => {
    const moiAvgs = p.mois.map((m) => perMoi[m.id].avg).filter((v) => v !== null);
    perPrinciple[p.id] = moiAvgs.length ? moiAvgs.reduce((a, b) => a + b, 0) / moiAvgs.length : null;
  });
  return { perMoi, perPrinciple };
}

function RadarChart({ perPrinciple }) {
  const cx = 140, cy = 140, R = 105;
  const n = CONTENT.principles.length;
  const pts = CONTENT.principles.map((p, i) => {
    const val = perPrinciple[p.id];
    const pct = val === null ? 0 : (val - 1) / 3;
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
    const r = R * pct;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (R + 34) * Math.cos(angle),
      labelY: cy + (R + 34) * Math.sin(angle),
      name: p.name,
      val,
    };
  });
  const ringPts = (frac) =>
    CONTENT.principles
      .map((p, i) => {
        const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
        return `${cx + R * frac * Math.cos(angle)},${cy + R * frac * Math.sin(angle)}`;
      })
      .join(" ");
  const dataPoly = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 280 320" width="100%" height="300" style={{ maxWidth: 340, display: "block", margin: "0 auto" }}>
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ringPts(f)} fill="none" stroke="#e4e1d8" strokeWidth="1" />
      ))}
      {CONTENT.principles.map((p, i) => {
        const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
        return (
          <line
            key={p.id}
            x1={cx} y1={cy}
            x2={cx + R * Math.cos(angle)} y2={cy + R * Math.sin(angle)}
            stroke="#e4e1d8" strokeWidth="1"
          />
        );
      })}
      <polygon points={dataPoly} fill="#185FA5" fillOpacity="0.18" stroke="#185FA5" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#185FA5" />
      ))}
      {pts.map((p, i) => (
        <g key={i}>
          <text x={p.labelX} y={p.labelY} fontSize="11" textAnchor="middle" fill="#5f5e5a">
            {p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name}
          </text>
          <text x={p.labelX} y={p.labelY + 13} fontSize="11" textAnchor="middle" fill="#185FA5" fontWeight="600">
            {p.val === null ? "—" : Math.round(((p.val - 1) / 3) * 100) + "%"}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadProjects() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (selected == null) return;
    fetch(`/api/responses?projectId=${selected}`)
      .then((r) => r.json())
      .then((data) => setResponses(data.responses || []));
  }, [selected]);

  async function handleAddProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "שגיאה בהוספת רשות");
      return;
    }
    setNewName("");
    loadProjects();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const selectedProject = projects.find((p) => p.id === selected);
  const sc = selected != null ? computeScores(responses) : null;

  const notes = responses.flatMap((r) =>
    Object.entries(r.answers)
      .filter(([, a]) => a.text && a.text.trim())
      .map(([mid, a]) => ({ mid, text: a.text, who: r.respondent_name + (r.respondent_role ? " · " + r.respondent_role : "") }))
  );

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand"><b>מצפן טייב לחינוך</b>לוח בקרה למנהל</div>
        <button className="btn ghost" onClick={handleLogout}>התנתקות</button>
      </div>

      <div className="card">
        <h2>הוספת רשות מקומית</h2>
        <form className="row" onSubmit={handleAddProject}>
          <input
            type="text"
            placeholder="לדוגמה: שדרות"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button className="btn" type="submit">הוספת רשות</button>
        </form>
        {error && <div className="error-box" style={{ marginTop: 10 }}>{error}</div>}
        <div className="proj-list">
          {loading ? (
            <div className="tiny">טוען...</div>
          ) : projects.length === 0 ? (
            <div className="tiny">עדיין לא נוספו רשויות.</div>
          ) : (
            projects.map((p) => (
              <div className="proj-item" key={p.id}>
                <div>
                  <div className="proj-name">{p.name}</div>
                  <div className="tiny">{p.response_count} משיבים</div>
                </div>
                <button className="btn secondary" onClick={() => setSelected(p.id)}>דוח בסיס</button>
              </div>
            ))
          )}
        </div>
      </div>

      {selected != null && selectedProject && (
        <div className="card">
          <h2>דוח בסיס: {selectedProject.name}</h2>
          {responses.length === 0 ? (
            <div className="empty">אין עדיין תשובות לרשות זו.</div>
          ) : (
            <>
              <div className="tiny" style={{ marginBottom: 8 }}>מבוסס על {responses.length} משיבים</div>
              <RadarChart perPrinciple={sc.perPrinciple} />
              {CONTENT.principles.map((pr) => (
                <div key={pr.id}>
                  <h3 style={{ marginTop: 18 }}>{pr.name}</h3>
                  {pr.mois.map((m) => {
                    const d = sc.perMoi[m.id];
                    const pct = d.avg === null ? 0 : Math.round(((d.avg - 1) / 3) * 100);
                    return (
                      <div className="bar-row" key={m.id}>
                        <div>{m.name} {d.divergent && <span className="divergence">חילוקי דעות</span>}</div>
                        <div className="bar-outer"><div className="bar-inner" style={{ width: `${pct}%` }} /></div>
                        <div>{d.avg === null ? "—" : pct + "%"}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <h3 style={{ marginTop: 20 }}>הערות ודוגמאות חופשיות</h3>
              {notes.length === 0 ? (
                <div className="tiny">אין הערות חופשיות עדיין.</div>
              ) : (
                notes.map((n, i) => {
                  const moi = ALL_MOIS.find((m) => m.id === n.mid);
                  return (
                    <div className="quote" key={i}>
                      {n.text}
                      <div className="who">{moi ? moi.name : ""} — {n.who}</div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
