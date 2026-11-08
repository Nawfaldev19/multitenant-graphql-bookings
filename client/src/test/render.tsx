import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "../lib/session";
import { WorkspaceContext, type Workspace } from "../components/workspace";

export const MEMBER_WORKSPACE: Workspace = {
  viewer: {
    __typename: "Viewer",
    id: "1",
    name: "Test Member",
    email: "member@example.com",
    memberships: [
      {
        __typename: "Membership",
        id: "10",
        role: "MEMBER",
        organization: { __typename: "Organization", id: "100", name: "Test Space" },
      },
    ],
  },
  membership: {
    __typename: "Membership",
    id: "10",
    role: "MEMBER",
    organization: { __typename: "Organization", id: "100", name: "Test Space" },
  },
  isManager: false,
};

export const MANAGER_WORKSPACE: Workspace = {
  ...MEMBER_WORKSPACE,
  membership: { ...MEMBER_WORKSPACE.membership, role: "STAFF" },
  isManager: true,
};

interface Options {
  mocks?: MockedResponse[];
  route?: string;
  path?: string;
  workspace?: Workspace | null;
}

/** Renders a page with Apollo mocks, a router, a session, and (optionally) a workspace. */
export function renderPage(
  ui: ReactElement,
  { mocks = [], route = "/", path = "*", workspace = MEMBER_WORKSPACE }: Options = {},
) {
  const page = workspace ? <WorkspaceContext.Provider value={workspace}>{ui}</WorkspaceContext.Provider> : ui;
  return render(
    <SessionProvider>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={page} />
            <Route path="/sign-in" element={<p>Sign-in screen</p>} />
            <Route path="/app/equipment" element={<p>Equipment screen</p>} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    </SessionProvider>,
  );
}
