import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readStored, writeStored } from "./storage";

const TOKEN_KEY = "equipment-bookings.token";
const ORGANIZATION_KEY = "equipment-bookings.organization";

export interface Session {
  token: string | null;
  organizationId: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  selectOrganization: (organizationId: string) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => readStored(TOKEN_KEY));
  const [organizationId, setOrganizationId] = useState(() => readStored(ORGANIZATION_KEY));

  const signIn = useCallback((nextToken: string) => {
    writeStored(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(() => {
    writeStored(TOKEN_KEY, null);
    setToken(null);
  }, []);

  const selectOrganization = useCallback((nextId: string) => {
    writeStored(ORGANIZATION_KEY, nextId);
    setOrganizationId(nextId);
  }, []);

  const value = useMemo(
    () => ({ token, organizationId, signIn, signOut, selectOrganization }),
    [token, organizationId, signIn, signOut, selectOrganization],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
