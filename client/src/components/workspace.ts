import { createContext, useContext } from "react";
import type { ViewerQuery } from "../graphql/generated/graphql";

type Viewer = NonNullable<ViewerQuery["viewer"]>;
export type MembershipSummary = Viewer["memberships"][number];

export interface Workspace {
  viewer: Viewer;
  membership: MembershipSummary;
  isManager: boolean;
}

export const WorkspaceContext = createContext<Workspace | null>(null);

/** The signed-in user and the organization they are working in. */
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used inside a signed-in route");
  return workspace;
}
