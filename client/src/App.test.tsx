import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { SessionProvider } from "./lib/session";

function renderAt(path: string) {
  return render(
    <SessionProvider>
      <MockedProvider mocks={[]}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </MockedProvider>
    </SessionProvider>,
  );
}

describe("App routes", () => {
  it("opens on a landing view that explains the demo", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1, name: "Shared equipment, booked fairly." })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "What this demo shows" }).children).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Try the demo" })).toHaveAttribute("href", "/sign-in");
  });

  it("sends signed-out visitors from the app to sign-in", () => {
    renderAt("/app/equipment");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a not-found page for unknown paths", () => {
    renderAt("/no-such-page");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
