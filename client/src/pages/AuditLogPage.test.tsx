import { screen } from "@testing-library/react";
import { AuditLogPage } from "./AuditLogPage";
import { AUDIT_EVENTS } from "../graphql/operations";
import { MANAGER_WORKSPACE, renderPage } from "../test/render";

describe("AuditLogPage", () => {
  it("tells members the log is for managers, without querying", () => {
    renderPage(<AuditLogPage />);
    expect(screen.getByRole("heading", { name: "Managers only" })).toBeInTheDocument();
  });

  it("shows events to managers", async () => {
    renderPage(<AuditLogPage />, {
      workspace: MANAGER_WORKSPACE,
      mocks: [
        {
          request: { query: AUDIT_EVENTS, variables: {} },
          result: {
            data: {
              auditEvents: {
                __typename: "AuditEventConnection",
                nodes: [
                  {
                    __typename: "AuditEvent",
                    id: "1",
                    action: "reservation.created",
                    subjectType: "Reservation",
                    subjectId: "9",
                    metadata: { equipment_id: 7 },
                    createdAt: "2031-03-10T09:00:00Z",
                    actor: { __typename: "Member", id: "1", name: "Ada Okafor" },
                  },
                ],
                pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
              },
            },
          },
        },
      ],
    });

    expect(await screen.findByText("reservation.created")).toBeInTheDocument();
    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText("Reservation #9")).toBeInTheDocument();
  });
});
