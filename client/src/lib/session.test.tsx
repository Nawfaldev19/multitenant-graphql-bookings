import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "./session";

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe("session", () => {
  it("persists the token and organization and clears the token on sign-out", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.signIn("token-123");
      result.current.selectOrganization("42");
    });
    expect(result.current.token).toBe("token-123");
    expect(window.localStorage.getItem("equipment-bookings.token")).toBe("token-123");
    expect(window.localStorage.getItem("equipment-bookings.organization")).toBe("42");

    act(() => {
      result.current.signOut();
    });
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem("equipment-bookings.token")).toBeNull();
    expect(result.current.organizationId).toBe("42");
  });

  it("restores a saved session", () => {
    window.localStorage.setItem("equipment-bookings.token", "saved");
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.token).toBe("saved");
  });

  it("throws a helpful error outside the provider", () => {
    const Probe = () => <p>{useSession().token}</p>;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow("useSession must be used inside <SessionProvider>");
    expect(screen.queryByText("saved")).toBeNull();
  });
});
