import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient, useMutation } from "@apollo/client";
import { LogIn } from "lucide-react";
import { PublicLayout } from "../components/PublicLayout";
import { SIGN_IN } from "../graphql/operations";
import { describeError } from "../lib/errors";
import { useSession } from "../lib/session";

export const DEMO_PASSWORD = "equipment-bookings-demo";

export const DEMO_ACCOUNTS = [
  { email: "ada@example.com", label: "Ada Okafor", detail: "Owner at Riverside Makers, member at Foundry Lane" },
  { email: "ben@example.com", label: "Ben Lindqvist", detail: "Staff at Riverside Makers" },
  { email: "cora@example.com", label: "Cora Mbeki", detail: "Member at Riverside Makers" },
  { email: "theo@example.com", label: "Theo Marsh", detail: "Owner at Foundry Lane Workshop" },
] as const;

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [signInMutation, { loading }] = useMutation(SIGN_IN);
  const { signIn } = useSession();
  const client = useApolloClient();
  const navigate = useNavigate();

  const attempt = async (credentials: { email: string; password: string }) => {
    setMessage(null);
    try {
      const { data } = await signInMutation({ variables: credentials });
      const payload = data?.signIn;
      if (!payload?.token) {
        setMessage(payload?.errors[0]?.message ?? "Sign-in failed");
        return;
      }
      await client.clearStore();
      signIn(payload.token);
      navigate("/app/equipment");
    } catch (error) {
      setMessage(describeError(error));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void attempt({ email, password });
  };

  return (
    <PublicLayout>
      <div className="split">
        <section className="card">
          <h1>Sign in</h1>
          {message && (
            <p className="alert alert-error" role="alert">
              {message}
            </p>
          )}
          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="button button-primary" type="submit" disabled={loading}>
              <LogIn size={18} aria-hidden="true" />
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
        <section className="card" aria-labelledby="demo-accounts-heading">
          <h2 id="demo-accounts-heading">Demo accounts</h2>
          <p className="meta">
            All use the password <code>{DEMO_PASSWORD}</code>. Ada belongs to two spaces, so you can watch the data
            switch.
          </p>
          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="button button-secondary"
                disabled={loading}
                onClick={() => void attempt({ email: account.email, password: DEMO_PASSWORD })}
              >
                Continue as {account.label}
                <span className="visually-hidden">, {account.detail}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
