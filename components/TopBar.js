// Shared top bar shown on every page: project logo on one side,
// TAIB Foundation logo on the other. Logo files live in /public.
export default function TopBar({ subtitle, children }) {
  return (
    <header className="topbar">
      <div className="topbar-side topbar-start">
        <img
          src="/logo-compass.jpeg"
          alt="מצפן טייב לחינוך"
          className="logo logo-project"
        />
      </div>
      {(subtitle || children) && (
        <div className="topbar-center">
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
          {children}
        </div>
      )}
      <div className="topbar-side topbar-end">
        <img
          src="/logo-foundation.jpg"
          alt="TAIB Foundation"
          className="logo logo-foundation"
        />
      </div>
    </header>
  );
}
