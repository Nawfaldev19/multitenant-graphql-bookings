import { useId, useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_RESERVATION } from "../../graphql/operations";
import { describeError, splitUserErrors } from "../../lib/errors";
import { DURATION_OPTIONS, bookingWindow, formatDuration, formatTimeRange, timeSlots } from "../../lib/time";

interface BookingFormProps {
  equipmentId: string;
  date: string;
  onDateChange: (date: string) => void;
  onBooked: () => void;
}

const SLOTS = timeSlots();

export function BookingForm({ equipmentId, date, onDateChange, onBooked }: BookingFormProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [createReservation, { loading }] = useMutation(CREATE_RESERVATION);
  const ids = useId();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setConfirmation(null);
    const requested = bookingWindow(date, startTime, duration);
    if (!requested) {
      setFieldErrors({ startsAt: "Choose a valid date and start time" });
      return;
    }
    try {
      const { data } = await createReservation({ variables: { equipmentId, ...requested, note } });
      const payload = data?.createReservation;
      const { byField, general } = splitUserErrors(payload?.errors ?? []);
      setFieldErrors(byField);
      setGeneralErrors(general);
      if (payload?.reservation) {
        setNote("");
        setConfirmation(`Booked ${formatTimeRange(payload.reservation.startsAt, payload.reservation.endsAt)}.`);
        onBooked();
      }
    } catch (error) {
      setFieldErrors({});
      setGeneralErrors([describeError(error)]);
    }
  };

  const timeError = fieldErrors.startsAt ?? fieldErrors.endsAt;
  const timeErrorId = `${ids}-time-error`;

  return (
    <form
      className="form-stack"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      aria-labelledby={`${ids}-heading`}
    >
      <h2 id={`${ids}-heading`}>Book a slot</h2>
      <div role="status" aria-live="polite">
        {confirmation && <p className="alert alert-success">{confirmation}</p>}
      </div>
      {generalErrors.map((message) => (
        <p key={message} className="alert alert-error" role="alert">
          {message}
        </p>
      ))}
      <div className="field">
        <label htmlFor={`${ids}-date`}>Date</label>
        <input
          id={`${ids}-date`}
          className="input"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${ids}-start`}>Start</label>
          <select
            id={`${ids}-start`}
            className="select"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            aria-invalid={timeError ? true : undefined}
            aria-describedby={timeError ? timeErrorId : undefined}
          >
            {SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${ids}-duration`}>Duration</label>
          <select
            id={`${ids}-duration`}
            className="select"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {timeError && (
        <p id={timeErrorId} className="field-error" role="alert">
          {timeError}
        </p>
      )}
      <div className="field">
        <label htmlFor={`${ids}-note`}>Note (optional)</label>
        <input
          id={`${ids}-note`}
          className="input"
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={fieldErrors.note ? true : undefined}
          aria-describedby={`${ids}-note-hint`}
        />
        <span id={`${ids}-note-hint`} className="field-hint">
          {fieldErrors.note ?? "What are you making? Visible to other members."}
        </span>
      </div>
      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? "Booking…" : "Book"}
      </button>
    </form>
  );
}
