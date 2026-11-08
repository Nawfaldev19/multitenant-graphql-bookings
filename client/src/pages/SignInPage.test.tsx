import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { DEMO_PASSWORD, SignInPage } from "./SignInPage";
import { SIGN_IN } from "../graphql/operations";
import { renderPage } from "../test/render";

const signInMock = (email: string, password: string, token: string | null): MockedResponse => ({
  request: { query: SIGN_IN, variables: { email, password } },
  result: {
    data: {
      signIn: {
        __typename: "SignInPayload",
        token,
        viewer: token ? { __typename: "Viewer", id: "1", name: "Ada" } : null,
        errors: token ? [] : [{ __typename: "UserError", field: null, message: "Email or password is incorrect" }],
      },
    },
  },
});

describe("SignInPage", () => {
  it("signs in with the form, stores the token, and opens the app", async () => {
    const user = userEvent.setup();
    renderPage(<SignInPage />, {
      workspace: null,
      mocks: [signInMock("ada@example.com", "secret-password", "token-1")],
    });

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Equipment screen")).toBeInTheDocument();
    expect(window.localStorage.getItem("equipment-bookings.token")).toBe("token-1");
  });

  it("shows the server's error for bad credentials", async () => {
    const user = userEvent.setup();
    renderPage(<SignInPage />, { workspace: null, mocks: [signInMock("ada@example.com", "wrong", null)] });

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
    expect(window.localStorage.getItem("equipment-bookings.token")).toBeNull();
  });

  it("one-click demo accounts use the demo password", async () => {
    const user = userEvent.setup();
    renderPage(<SignInPage />, { workspace: null, mocks: [signInMock("ben@example.com", DEMO_PASSWORD, "token-2")] });

    await user.click(screen.getByRole("button", { name: /Continue as Ben Lindqvist/ }));

    expect(await screen.findByText("Equipment screen")).toBeInTheDocument();
  });
});
