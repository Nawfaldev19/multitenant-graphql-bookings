import { ApolloError } from "@apollo/client";

export interface UserError {
  field?: string | null;
  message: string;
}

/** Splits mutation errors into per-field messages and whole-form messages. */
export function splitUserErrors(errors: readonly UserError[]): { byField: Record<string, string>; general: string[] } {
  const byField: Record<string, string> = {};
  const general: string[] = [];
  for (const error of errors) {
    if (error.field) byField[error.field] ??= error.message;
    else general.push(error.message);
  }
  return { byField, general };
}

export function errorCodes(error: unknown): string[] {
  if (!(error instanceof ApolloError)) return [];
  return error.graphQLErrors.map((graphQLError) => {
    const code = graphQLError.extensions?.code;
    return typeof code === "string" ? code : "";
  });
}

/** A short, human message for any failed request. */
export function describeError(error: unknown): string {
  const codes = errorCodes(error);
  if (codes.includes("NOT_FOUND"))
    return "We couldn't find that. It may have been removed, or it belongs to another space.";
  if (codes.includes("FORBIDDEN")) return "Your role in this space doesn't allow that.";
  if (codes.includes("TENANT_REQUIRED")) return "Choose a space you belong to.";
  if (error instanceof ApolloError && error.networkError)
    return "We couldn't reach the server. Check that it is running and try again.";
  return "Something went wrong. Please try again.";
}
