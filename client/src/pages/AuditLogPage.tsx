import { NetworkStatus, useQuery } from "@apollo/client";
import { AUDIT_EVENTS } from "../graphql/operations";
import { EmptyState, ErrorState, SkeletonBlock } from "../components/States";
import { useWorkspace } from "../components/workspace";
import { formatDateTime } from "../lib/time";

export function AuditLogPage() {
  const { isManager } = useWorkspace();
  const { data, error, refetch, fetchMore, networkStatus } = useQuery(AUDIT_EVENTS, {
    skip: !isManager,
    notifyOnNetworkStatusChange: true,
  });

  if (!isManager) {
    return <EmptyState title="Managers only">Owners and staff can see who changed what in this space.</EmptyState>;
  }
  const page = data?.auditEvents;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Audit log</h1>
          <p>Every change in this space, newest first. Entries cannot be edited.</p>
        </div>
      </div>
      {error && !page ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !page ? (
        <div role="status">
          <span className="visually-hidden">Loading audit log</span>
          <SkeletonBlock height="8rem" />
        </div>
      ) : page.nodes.length === 0 ? (
        <EmptyState title="Nothing recorded yet" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Audit events</caption>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">Action</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {page.nodes.map((event) => (
                  <tr key={event.id}>
                    <td className="mono">{formatDateTime(event.createdAt)}</td>
                    <td>{event.actor.name}</td>
                    <td className="mono">{event.action}</td>
                    <td className="mono">
                      {event.subjectType} #{event.subjectId}
                    </td>
                    <td className="mono">{JSON.stringify(event.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {page.pageInfo.hasNextPage && (
            <div className="pagination">
              <button
                type="button"
                className="button button-secondary"
                disabled={networkStatus === NetworkStatus.fetchMore}
                onClick={() => void fetchMore({ variables: { after: page.pageInfo.endCursor } })}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
