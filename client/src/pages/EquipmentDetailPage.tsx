import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { ArrowLeft, MapPin } from "lucide-react";
import { EQUIPMENT_DETAIL, RETIRE_EQUIPMENT } from "../graphql/operations";
import { BookingForm } from "../features/booking/BookingForm";
import { ErrorState, SkeletonBlock } from "../components/States";
import { useWorkspace } from "../components/workspace";
import { dayWindow, formatTimeRange, toDateInputValue } from "../lib/time";
import { describeError } from "../lib/errors";

export function EquipmentDetailPage() {
  const { id = "" } = useParams();
  const { isManager } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? toDateInputValue(new Date());
  const range = dayWindow(date) ?? dayWindow(toDateInputValue(new Date()));
  const { data, error, refetch } = useQuery(EQUIPMENT_DETAIL, {
    variables: { id, from: range?.from ?? "", to: range?.to ?? "" },
    skip: !range,
  });

  const setDate = (value: string) => {
    if (dayWindow(value)) setParams({ date: value }, { replace: true });
  };

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  const item = data?.equipmentItem;
  if (!item) {
    return (
      <div role="status">
        <span className="visually-hidden">Loading equipment</span>
        <SkeletonBlock height="2.5rem" width="50%" />
      </div>
    );
  }

  return (
    <>
      <Link to="/app/equipment" className="meta">
        <ArrowLeft size={16} aria-hidden="true" /> All equipment
      </Link>
      <div className="page-header">
        <div>
          <span className="badge">{item.category}</span>
          <h1>{item.name}</h1>
          {item.location && (
            <p className="meta">
              <MapPin size={14} aria-hidden="true" />
              {item.location}
            </p>
          )}
        </div>
        {isManager && item.active && <RetireControl equipmentId={item.id} />}
      </div>
      <div className="split">
        <section className="card" aria-labelledby="schedule-heading">
          {item.description && <p>{item.description}</p>}
          <h2 id="schedule-heading">
            Schedule for {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "full" })}
          </h2>
          {item.reservations.length === 0 ? (
            <p className="meta">Nothing booked on this day.</p>
          ) : (
            <ol className="timeline">
              {item.reservations.map((reservation) => (
                <li key={reservation.id}>
                  <span className="mono">{formatTimeRange(reservation.startsAt, reservation.endsAt)}</span>
                  <span>
                    {reservation.isMine ? "You" : reservation.member.name}
                    {reservation.note && <span className="meta"> · {reservation.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card">
          {item.active ? (
            <BookingForm equipmentId={item.id} date={date} onDateChange={setDate} onBooked={() => void refetch()} />
          ) : (
            <p className="alert alert-error">This equipment has been retired and can no longer be booked.</p>
          )}
        </section>
      </div>
    </>
  );
}

function RetireControl({ equipmentId }: { equipmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retire, { loading }] = useMutation(RETIRE_EQUIPMENT);

  const confirm = async () => {
    try {
      const { data } = await retire({ variables: { id: equipmentId } });
      const problem = data?.retireEquipment?.errors[0]?.message;
      setMessage(problem ?? null);
    } catch (error) {
      setMessage(describeError(error));
    }
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <div>
        <button type="button" className="button button-danger" onClick={() => setConfirming(true)}>
          Retire equipment
        </button>
        {message && <p className="field-error">{message}</p>}
      </div>
    );
  }
  return (
    <div role="group" aria-label="Confirm retiring this equipment" style={{ display: "flex", gap: "var(--space-2)" }}>
      <button type="button" className="button button-danger" disabled={loading} onClick={() => void confirm()}>
        Yes, retire it
      </button>
      <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>
        Keep it
      </button>
    </div>
  );
}
