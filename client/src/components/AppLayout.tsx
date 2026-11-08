import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { LogOut } from "lucide-react";
import { useSession } from "../lib/session";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { useWorkspace } from "./workspace";

export function AppLayout() {
  const { viewer, membership, isManager } = useWorkspace();
  const { selectOrganization, signOut } = useSession();
  const client = useApolloClient();
  const navigate = useNavigate();

  // Cached query results belong to one organization; drop them on switch.
  const switchOrganization = async (organizationId: string) => {
    selectOrganization(organizationId);
    await client.resetStore();
    navigate("/app/equipment");
  };

  const handleSignOut = async () => {
    signOut();
    await client.clearStore();
    navigate("/sign-in");
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Brand to="/app/equipment" />
        <nav className="nav" aria-label="Main">
          <NavLink to="/app/equipment">Equipment</NavLink>
          <NavLink to="/app/reservations">My reservations</NavLink>
          {isManager && <NavLink to="/app/audit">Audit log</NavLink>}
        </nav>
        <div className="topbar-end">
          <label className="visually-hidden" htmlFor="organization-switcher">
            Space
          </label>
          <select
            id="organization-switcher"
            className="select"
            value={membership.organization.id}
            onChange={(event) => void switchOrganization(event.target.value)}
          >
            {viewer.memberships.map((option) => (
              <option key={option.id} value={option.organization.id}>
                {option.organization.name} ({option.role.toLowerCase()})
              </option>
            ))}
          </select>
          <ThemeToggle />
          <button type="button" className="button button-ghost" onClick={() => void handleSignOut()}>
            <LogOut size={18} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <main id="main" className="main">
        <Outlet />
      </main>
    </div>
  );
}
