import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { WorkspaceContext, type Workspace } from "./workspace";
import { SessionProvider } from "../lib/session";
import { MANAGER_WORKSPACE, MEMBER_WORKSPACE } from "../test/render";

const TWO_SPACES: Workspace = {
  ...MANAGER_WORKSPACE,
  viewer: {
    ...MANAGER_WORKSPACE.viewer,
    memberships: [
      MANAGER_WORKSPACE.membership,
      {
        __typename: "Membership",
        id: "11",
        role: "MEMBER",
        organization: { __typename: "Organization", id: "200", name: "Other Space" },
      },
    ],
  },
};

function renderLayout(workspace: Workspace) {
  return render(
    <SessionProvider>
      <MockedProvider mocks={[]}>
        <MemoryRouter initialEntries={["/app/reservations"]}>
          <WorkspaceContext.Provider value={workspace}>
            <Routes>
              <Route path="/app" element={<AppLayout />}>
                <Route path="reservations" element={<p>Reservations outlet</p>} />
                <Route path="equipment" element={<p>Equipment outlet</p>} />
              </Route>
              <Route path="/sign-in" element={<p>Sign-in screen</p>} />
            </Routes>
          </WorkspaceContext.Provider>
        </MemoryRouter>
      </MockedProvider>
    </SessionProvider>,
  );
}

describe("AppLayout", () => {
  it("renders the outlet and marks the current page in the nav", () => {
    renderLayout(MEMBER_WORKSPACE);
    expect(screen.getByText("Reservations outlet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My reservations" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Audit log" })).toBeNull();
  });

  it("shows the audit log link to managers", () => {
    renderLayout(MANAGER_WORKSPACE);
    expect(screen.getByRole("link", { name: "Audit log" })).toBeInTheDocument();
  });

  it("switches organization and returns to the equipment list", async () => {
    const user = userEvent.setup();
    renderLayout(TWO_SPACES);

    await user.selectOptions(screen.getByLabelText("Space"), "200");

    expect(await screen.findByText("Equipment outlet")).toBeInTheDocument();
    expect(window.localStorage.getItem("equipment-bookings.organization")).toBe("200");
  });

  it("signs out and clears the stored token", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("equipment-bookings.token", "t");
    renderLayout(MEMBER_WORKSPACE);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
    expect(window.localStorage.getItem("equipment-bookings.token")).toBeNull();
  });
});
