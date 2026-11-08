import { Link } from "react-router-dom";
import { CalendarClock, KeyRound, ListChecks, ShieldCheck, Workflow } from "lucide-react";
import { PublicLayout } from "../components/PublicLayout";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    body: "Each makerspace's data is filtered at the model layer. Cross-space ids look like they don't exist.",
  },
  {
    icon: CalendarClock,
    title: "Conflict-safe booking",
    body: "Overlapping reservations are refused, even when two people click at the same moment.",
  },
  {
    icon: KeyRound,
    title: "Roles per space",
    body: "Owners and staff manage equipment and see the audit log. Members book and cancel their own slots.",
  },
  {
    icon: Workflow,
    title: "Typed GraphQL end to end",
    body: "The client's TypeScript types are generated from the Rails schema, so drift fails the build.",
  },
  {
    icon: ListChecks,
    title: "Audit trail",
    body: "Every change records who did it, to what, and when. Entries are append-only.",
  },
];

export function LandingPage() {
  return (
    <PublicLayout>
      <section className="hero">
        <p className="badge">Portfolio demo</p>
        <h1>Shared equipment, booked fairly.</h1>
        <p className="lead">
          Equipment Bookings serves a fictional network of community makerspaces. This demo is its booking system: a
          multi-tenant GraphQL API in Rails with a typed React client.
        </p>
        <Link className="button button-primary" to="/sign-in">
          Try the demo
        </Link>
      </section>
      <ul className="feature-list" aria-label="What this demo shows">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <h3>{title}</h3>
              <p className="meta">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </PublicLayout>
  );
}
