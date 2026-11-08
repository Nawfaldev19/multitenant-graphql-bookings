import { Link } from "react-router-dom";
import { PublicLayout } from "../components/PublicLayout";
import { EmptyState } from "../components/States";

export function NotFoundPage() {
  return (
    <PublicLayout>
      <EmptyState
        title="Page not found"
        action={
          <Link className="button button-secondary" to="/">
            Back to the start
          </Link>
        }
      >
        The address may be mistyped, or the page has moved.
      </EmptyState>
    </PublicLayout>
  );
}
