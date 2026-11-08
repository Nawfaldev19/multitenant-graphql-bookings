import { ApolloError } from "@apollo/client";
import { GraphQLError } from "graphql";
import { describeError, errorCodes, splitUserErrors } from "./errors";

const coded = (code: string) => new ApolloError({ graphQLErrors: [new GraphQLError("x", { extensions: { code } })] });

describe("splitUserErrors", () => {
  it("separates field errors from whole-form errors and keeps the first per field", () => {
    const result = splitUserErrors([
      { field: "startsAt", message: "Overlaps" },
      { field: "startsAt", message: "Second problem" },
      { field: null, message: "General problem" },
    ]);
    expect(result).toEqual({ byField: { startsAt: "Overlaps" }, general: ["General problem"] });
  });

  it("handles an empty list", () => {
    expect(splitUserErrors([])).toEqual({ byField: {}, general: [] });
  });
});

describe("errorCodes", () => {
  it("reads extension codes from Apollo errors only", () => {
    expect(errorCodes(coded("NOT_FOUND"))).toEqual(["NOT_FOUND"]);
    expect(errorCodes(new Error("plain"))).toEqual([]);
  });
});

describe("describeError", () => {
  it.each([
    ["NOT_FOUND", /couldn't find/],
    ["FORBIDDEN", /role/],
    ["TENANT_REQUIRED", /Choose a space/],
  ])("explains %s", (code, pattern) => {
    expect(describeError(coded(code))).toMatch(pattern);
  });

  it("explains network failures", () => {
    expect(describeError(new ApolloError({ networkError: new Error("offline") }))).toMatch(/reach the server/);
  });

  it("falls back to a generic message", () => {
    expect(describeError("weird")).toBe("Something went wrong. Please try again.");
  });
});
