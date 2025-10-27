import type { MouseEvent, PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavigationGuardContext } from "../hooks/useNavigationGuard";

export const AppLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const showBack = location.pathname.startsWith("/convert/");

  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const contextValue = useMemo(
    () => ({ guardMessage, setGuardMessage }),
    [guardMessage],
  );

  useEffect(() => {
    if (!guardMessage) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = guardMessage;
      return guardMessage;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [guardMessage]);

  const handleGuardedNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!guardMessage) {
      return;
    }
    const confirmed = window.confirm(guardMessage);
    if (!confirmed) {
      event.preventDefault();
    } else {
      setGuardMessage(null);
    }
  };

  return (
    <NavigationGuardContext.Provider value={contextValue}>
      <div className="app-shell">
        <header className="app-header">
          <Link to="/" className="brand" onClick={handleGuardedNavigation}>
            <img src="/converti-logo.svg" alt="Converti logo" className="brand-logo" />
            <span className="brand-mark">Converti</span>
          </Link>
          {showBack && (
            <Link to="/" className="back-link" onClick={handleGuardedNavigation}>
              &lt;- Back
            </Link>
          )}
        </header>
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <p>Copyright {new Date().getFullYear()} Converti. Convert files with ease.</p>
        </footer>
      </div>
    </NavigationGuardContext.Provider>
  );
};
