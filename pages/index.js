import { useEffect, useState } from "react";
import { ALL_MOIS, CONTENT, LETTERS } from "../lib/content";

function IntroStep({ onNext, onBack }) {
  return (
    <div className="card">
      <h2>איך עובד השאלון הזה?</h2>
      <p className="muted">
        בכל שאלה נתאר קודם מצב אמיתי — סיפור קצר שממחיש איך עקרון או מנגנון מסוים בא (או לא בא) לידי
        ביטוי בחיי היום-יום. לאחר מכן נציג את המושג המחקרי שעומד מאחורי הסיפור, ונבקש מכם לבחור את
        התיאור הקרוב ביותר למציאות ברשות שלכם.
      </p>
      <p className="muted">
        אחרי שתבחרו תשובה, נציג לכם דוגמאות אמיתיות מרשויות אחרות בעולם שהתמודדו עם אותו נושא — כך
        שהשאלון הוא גם הזדמנות ללמוד איך אחרים פתרו בעיות דומות.
      </p>
      <div className="row between">
        <button className="btn ghost" onClick={onBack}>חזרה</button>
        <button className="btn" onClick={onNext}>התחלת השאלון</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [step, setStep] = useState(-3); // -3 select project, -2 intake, -1 intro, 0..14 questions, 15 thank you
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  async function handleFinalSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: Number(projectId), name, role, answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "שגיאה בשליחת השאלון");
      }
      setStep(ALL_MOIS.length);
    } catch (e) {
      setSubmitError(e.message || "שגיאה בשליחת השאלון. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === -3) {
    return (
      <div className="wrap">
        <Header />
        <div className="card">
          <h2>ברוכים הבאים לשאלון הבסיס</h2>
          {loadingProjects ? (
            <p className="muted">טוען...</p>
          ) : projects.length === 0 ? (
            <div className="empty">
              אין עדיין רשויות זמינות למילוי.
              <br />
              פנו לצוות הקרן כדי להוסיף את הרשות שלכם.
            </div>
          ) : (
            <div className="field">
              <label>בחרו את הרשות המקומית שלכם</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">בחרו רשות...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn" disabled={!projectId} onClick={() => setStep(-2)}>המשך</button>
        </div>
      </div>
    );
  }

  if (step === -2) {
    return (
      <div className="wrap">
        <Header />
        <div className="card">
          <h2>פרטי המשיב/ה</h2>
          <div className="field">
            <label>שם מלא</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ישראל ישראלי" />
          </div>
          <div className="field">
            <label>תפקיד</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="מנהל/ת אגף חינוך" />
          </div>
          <div className="row between">
            <button className="btn ghost" onClick={() => setStep(-3)}>חזרה</button>
            <button className="btn" onClick={() => setStep(-1)}>המשך</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className="wrap">
        <Header />
        <IntroStep onBack={() => setStep(-2)} onNext={() => setStep(0)} />
      </div>
    );
  }

  if (step >= 0 && step < ALL_MOIS.length) {
    const m = ALL_MOIS[step];
    const pr = CONTENT.principles.find((p) => p.id === m.principleId);
    const current = answers[m.id] || {};
    const isRevealed = !!revealed[m.id];

    return (
      <div className="wrap">
        <Header />
        <div className="progress-outer">
          <div className="progress-inner" style={{ width: `${Math.round((step / ALL_MOIS.length) * 100)}%` }} />
        </div>
        <div className="tiny" style={{ marginBottom: 10 }}>
          שאלה {step + 1} מתוך {ALL_MOIS.length} · עקרון {pr.id}: {pr.name}
        </div>
        <div className="card">
          <div className="vignette">{m.vignette}</div>
          <div className="term-box">המושג המחקרי: {m.name}</div>
          <p style={{ fontWeight: 600, margin: "6px 0 12px" }}>{m.question}</p>
          {m.options.map((opt, i) => {
            const score = i + 1;
            const isSelected = current.score === score;
            return (
              <div
                key={i}
                className={"option-card" + (isSelected ? " selected" : "") + (isRevealed ? " locked" : "")}
                onClick={() => {
                  if (isRevealed) return;
                  setAnswers({ ...answers, [m.id]: { score, text: current.text || "" } });
                }}
              >
                <div className="opt-row">
                  <span className="option-letter">{LETTERS[i]}</span>
                  <span>{opt}</span>
                </div>
              </div>
            );
          })}

          {!isRevealed ? (
            <div className="steps-nav">
              <button className="btn ghost" onClick={() => setStep(step === 0 ? -1 : step - 1)}>הקודם</button>
              <button
                className="btn"
                disabled={!current.score}
                onClick={() => setRevealed({ ...revealed, [m.id]: true })}
              >
                הצג דוגמאות מהמחקר
              </button>
            </div>
          ) : (
            <>
              <div className="learn-panel">
                <h4>כך פעלו רשויות אחרות בעולם</h4>
                {m.practices.map((pr2, i) => (
                  <div className="practice" key={i}>
                    <div className="city">{pr2.city}</div>
                    <p>{pr2.text}</p>
                  </div>
                ))}
              </div>
              <div className="field">
                <label>רוצים להוסיף הסבר, דוגמה או סיפור קצר מהרשות שלכם? (רשות)</label>
                <textarea
                  value={current.text || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [m.id]: { score: current.score, text: e.target.value } })
                  }
                />
              </div>
              {submitError && <div className="error-box">{submitError}</div>}
              <div className="steps-nav">
                <button className="btn ghost" onClick={() => setStep(step === 0 ? -1 : step - 1)}>הקודם</button>
                <button
                  className="btn"
                  disabled={submitting}
                  onClick={() => {
                    if (step === ALL_MOIS.length - 1) {
                      handleFinalSubmit();
                    } else {
                      setStep(step + 1);
                    }
                  }}
                >
                  {submitting ? "שולח..." : step === ALL_MOIS.length - 1 ? "סיום" : "לשאלה הבאה"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <Header />
      <div className="card" style={{ textAlign: "center" }}>
        <h2>תודה!</h2>
        <p className="muted">
          תודה רבה על הזמן ועל השיתוף. התובנות שלכם הן הבסיס לתמונת המצב שתלווה את תהליך גיבוש
          אסטרטגיית החינוך של הרשות. צוות הקרן יחזור אליכם עם סיכום הממצאים.
        </p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="topbar">
      <div className="brand">
        <b>מצפן טייב לחינוך</b>שאלון בסיס
      </div>
    </div>
  );
}
