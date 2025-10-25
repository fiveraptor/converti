import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

export const AppLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const showBack = location.pathname.startsWith("/convert/");

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
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

