// Coerce any thrown value (Error, Supabase error object, string) to a string.
// Supabase errors are plain objects with .message, not Error instances,
// so String(err) would render "[object Object]".
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
