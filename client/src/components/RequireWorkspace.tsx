import { useEffect, useMemo, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { VIEWER } from "../graphql/operations";
import { useSession } from "../lib/session";
import { EmptyState, ErrorState, SkeletonBlock } from "./States";
import { WorkspaceContext } from "./workspace";

/**
 * Gate for signed-in routes. Resolves the viewer, then makes sure the selected
 * organization is one they belong to (falling back to their first membership).
 */
export function RequireWorkspace({ children }: { children: ReactNode }) {
  const { token, organizationId, selectOrganization } = useSession();
  const { data, loading, error, refetch } = useQuery(VIEWER, { skip: !token });
  const viewer = data?.viewer ?? null;
  const membership = viewer?.memberships.find((candidate) => candidate.organization.id === organizationId) ?? null;
  const fallback = viewer?.memberships[0] ?? null;

  useEffect(() => {
    if (!membership && fallback) selectOrganization(fallback.organization.id);
  }, [membership, fallback, selectOrganization]);

  const workspace = useMemo(
    () => (viewer && membership ? { viewer, membership, isManager: membership.role !== "MEMBER" } : null),
    [viewer, membership],
  );

  if (!token) return <Navigate to="/sign-in" replace />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (loading || !data) {
    return (
      <div role="status" className="main">
        <span className="visually-hidden">Loading your workspace</span>
        <SkeletonBlock height="2.5rem" width="40%" />
      </div>
    );
  }
  if (!viewer) return <Navigate to="/sign-in" replace />;
  if (viewer.memberships.length === 0) {
    return <EmptyState title="No spaces yet">Ask a space owner to add you, then sign in again.</EmptyState>;
  }
  if (!workspace) return null;

  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}
