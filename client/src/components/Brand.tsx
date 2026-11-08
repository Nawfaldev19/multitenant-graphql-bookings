import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand">
      <Wrench className="brand-mark" size={22} aria-hidden="true" />
      Equipment Bookings
    </Link>
  );
}
