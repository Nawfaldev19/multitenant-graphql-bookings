import { gql } from "@apollo/client";
import { createApolloClient } from "./apollo";

const QUERY = gql`
  query Probe {
    viewer {
      id
    }
  }
`;

function stubFetch(body: object) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createApolloClient", () => {
  it("sends the current token and organization with each request", async () => {
    const fetchMock = stubFetch({ data: { viewer: null } });
    let token: string | null = "first";
    const client = createApolloClient({
      getToken: () => token,
      getOrganizationId: () => "12",
      onUnauthenticated: vi.fn(),
    });

    await client.query({ query: QUERY, fetchPolicy: "network-only" });
    token = "second";
    await client.query({ query: QUERY, fetchPolicy: "network-only" });

    const headersOf = (call: number) =>
      (fetchMock.mock.calls[call] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    // Apollo's HttpLink lower-cases header names.
    expect(headersOf(0)).toMatchObject({ authorization: "Bearer first", "x-organization-id": "12" });
    expect(headersOf(1)).toMatchObject({ authorization: "Bearer second" });
  });

  it("omits headers when signed out", async () => {
    const fetchMock = stubFetch({ data: { viewer: null } });
    const client = createApolloClient({
      getToken: () => null,
      getOrganizationId: () => null,
      onUnauthenticated: vi.fn(),
    });

    await client.query({ query: QUERY });

    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers).not.toHaveProperty("authorization");
    expect(headers).not.toHaveProperty("x-organization-id");
  });

  it("signals UNAUTHENTICATED responses", async () => {
    stubFetch({ data: null, errors: [{ message: "Sign in", extensions: { code: "UNAUTHENTICATED" } }] });
    const onUnauthenticated = vi.fn();
    const client = createApolloClient({ getToken: () => "old", getOrganizationId: () => null, onUnauthenticated });

    await expect(client.query({ query: QUERY })).rejects.toThrow("Sign in");
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });
});
