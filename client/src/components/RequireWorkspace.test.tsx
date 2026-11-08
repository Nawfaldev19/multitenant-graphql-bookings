import { screen } from "@testing-library/react";
import type { MockedResponse } from "@apollo/client/testing";
import { RequireWorkspace } from "./RequireWorkspace";
import { useWorkspace } from "./workspace";
import { VIEWER } from "../graphql/operations";
import { renderPage } from "../test/render";

function Probe() {
  const { membership, isManager } = useWorkspace();
  return (
    <p>
      In {membership.organization.name} as {isManager ? "manager" : "member"}
    </p>
  );
}

const viewerMock = (viewer: object | null): MockedResponse => ({
  request: { query: VIEWER },
  result: { data: { viewer } },
});

const membership = (id: string, name: string, role: string) => ({
  __typename: "Membership",
  id: `m${id}`,
  role,
  organization: { __typename: "Organization", id, name },
});

const viewer = (memberships: object[]) => ({
  __typename: "Viewer",
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  memberships,
});

describe("RequireWorkspace", () => {
  it("redirects to sign-in without a token", () => {
    renderPage(
      <RequireWorkspace>
        <Probe />
      </RequireWorkspace>,
      { workspace: null },
    );
    expect(screen.getByText("Sign-in screen")).toBeInTheDocument();
  });

  it("falls back to the first membership when the saved organization is not one of the viewer's", async () => {
    window.localStorage.setItem("equipment-bookings.token", "t");
    window.localStorage.setItem("equipment-bookings.organization", "999");
    renderPage(
      <RequireWorkspace>
        <Probe />
      </RequireWorkspace>,
      {
        workspace: null,
        mocks: [viewerMock(viewer([membership("1", "Riverside", "OWNER"), membership("2", "Foundry", "MEMBER")]))],
      },
    );

    expect(await screen.findByText("In Riverside as manager")).toBeInTheDocument();
    expect(window.localStorage.getItem("equipment-bookings.organization")).toBe("1");
  });

  it("uses the saved organization when the viewer belongs to it", async () => {
    window.localStorage.setItem("equipment-bookings.token", "t");
    window.localStorage.setItem("equipment-bookings.organization", "2");
    renderPage(
      <RequireWorkspace>
        <Probe />
      </RequireWorkspace>,
      {
        workspace: null,
        mocks: [viewerMock(viewer([membership("1", "Riverside", "OWNER"), membership("2", "Foundry", "MEMBER")]))],
      },
    );

    expect(await screen.findByText("In Foundry as member")).toBeInTheDocument();
  });

  it("explains when the viewer has no memberships", async () => {
    window.localStorage.setItem("equipment-bookings.token", "t");
    renderPage(
      <RequireWorkspace>
        <Probe />
      </RequireWorkspace>,
      { workspace: null, mocks: [viewerMock(viewer([]))] },
    );

    expect(await screen.findByRole("heading", { name: "No spaces yet" })).toBeInTheDocument();
  });

  it("sends an expired session back to sign-in", async () => {
    window.localStorage.setItem("equipment-bookings.token", "expired");
    renderPage(
      <RequireWorkspace>
        <Probe />
      </RequireWorkspace>,
      { workspace: null, mocks: [viewerMock(null)] },
    );

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
  });
});
