import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/graphql";

interface ClientOptions {
  getToken: () => string | null;
  getOrganizationId: () => string | null;
  onUnauthenticated: () => void;
}

/**
 * Every request carries the bearer token and the selected organization.
 * The server re-checks membership on each request, so the header is a
 * selection, not a grant.
 */
export function createApolloClient({ getToken, getOrganizationId, onUnauthenticated }: ClientOptions) {
  const sessionHeaders = new ApolloLink((operation, forward) => {
    const token = getToken();
    const organizationId = getOrganizationId();
    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
      },
    }));
    return forward(operation);
  });

  // `response` is the Apollo Client 3 name; version 4 renames it to `result`.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const authErrors = onError(({ response }) => {
    if (response?.errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED")) onUnauthenticated();
  });

  return new ApolloClient({
    link: from([authErrors, sessionHeaders, new HttpLink({ uri: API_URL })]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // "Load more" appends pages for the same search and category.
            equipment: {
              keyArgs: ["search", "category"],
              merge(existing: { nodes: unknown[] } | undefined, incoming: { nodes: unknown[] }, { args }) {
                if (!existing || !args?.after) return incoming;
                return { ...incoming, nodes: [...existing.nodes, ...incoming.nodes] };
              },
            },
            auditEvents: {
              keyArgs: false,
              merge(existing: { nodes: unknown[] } | undefined, incoming: { nodes: unknown[] }, { args }) {
                if (!existing || !args?.after) return incoming;
                return { ...incoming, nodes: [...existing.nodes, ...incoming.nodes] };
              },
            },
          },
        },
      },
    }),
  });
}
