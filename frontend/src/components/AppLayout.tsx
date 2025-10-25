
import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

export const AppLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const showBack = location.pathname.startsWith("/convert/");

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <img src="/converti-logo.svg" alt="" className="brand-logo" />
          <span className="brand-mark">Converti</span>
        </Link>
        {showBack && (
          <Link to="/" className="back-link">
            ← Zurück
          </Link>
        )}
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Converti. Dateien einfach konvertieren.</p>
      </footer>
    </div>
  );
};
