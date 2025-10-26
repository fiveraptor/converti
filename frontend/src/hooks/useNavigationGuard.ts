import { createContext, useContext } from "react";

type NavigationGuardContextValue = {
  guardMessage: string | null;
  setGuardMessage: (message: string | null) => void;
};

export const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export const useNavigationGuard = (): NavigationGuardContextValue => {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within a NavigationGuardContext provider");
  }
  return context;
};
