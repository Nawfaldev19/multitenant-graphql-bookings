import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { CANCEL_RESERVATION, MY_RESERVATIONS } from "../graphql/operations";
import { EmptyState, ErrorState, SkeletonBlock } from "../components/States";
import { describeError } from "../lib/errors";
import { formatDate, formatTimeRange } from "../lib/time";

export function MyReservationsPage() {
  const [includePast, setIncludePast] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const { data, error, refetch } = useQuery(MY_RESERVATIONS, { variables: { includePast } });
  const [cancelReservation, { loading: cancelling }] = useMutation(CANCEL_RESERVATION);

  const cancel = async (id: string, label: string) => {
    try {
      const { data: result } = await cancelReservation({ variables: { id } });
      const problem = result?.cancelReservation?.errors[0]?.message;
      setMessage(problem ? { tone: "error", text: problem } : { tone: "success", text: `Cancelled ${label}.` });
    } catch (caught) {
      setMessage({ tone: "error", text: describeError(caught) });
    }
  };

  const reservations = data?.myReservations.nodes;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My reservations</h1>
          <p>Your bookings in this space.</p>
        </div>
        <label className="meta">
          <input type="checkbox" checked={includePast} onChange={(event) => setIncludePast(event.target.checked)} />{" "}
          Include past bookings
        </label>
      </div>
      <div role="status" aria-live="polite">
        {message && <p className={`alert alert-${message.tone}`}>{message.text}</p>}
      </div>
      {error && !reservations ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !reservations ? (
        <div role="status">
          <span className="visually-hidden">Loading reservations</span>
          <SkeletonBlock height="8rem" />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No reservations yet"
          action={
            <Link className="button button-primary" to="/app/equipment">
              Browse equipment
            </Link>
          }
        >
          Book a slot on any piece of equipment and it will show up here.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">Your reservations</caption>
            <thead>
              <tr>
                <th scope="col">Equipment</th>
                <th scope="col">When</th>
                <th scope="col">Note</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => {
                const when = `${formatDate(reservation.startsAt)}, ${formatTimeRange(reservation.startsAt, reservation.endsAt)}`;
                return (
                  <tr key={reservation.id}>
                    <td>
                      <Link to={`/app/equipment/${reservation.equipment.id}`}>{reservation.equipment.name}</Link>
                    </td>
                    <td className="mono">{when}</td>
                    <td>{reservation.note}</td>
                    <td>
                      <span
                        className={`badge ${reservation.status === "CONFIRMED" ? "badge-success" : "badge-danger"}`}
                      >
                        {reservation.status.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {reservation.canCancel && (
                        <button
                          type="button"
                          className="button button-danger"
                          disabled={cancelling}
                          onClick={() => void cancel(reservation.id, `${reservation.equipment.name} on ${when}`)}
                        >
                          Cancel
                          <span className="visually-hidden">
                            {" "}
                            {reservation.equipment.name} on {when}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
