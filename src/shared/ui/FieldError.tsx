/**
 * Renders a form field's validation message, or nothing at all.
 *
 * Takes `unknown` because `useFormContext()` widens `errors` to `FieldValues`,
 * where a message is typed as `string | ReactNode | undefined`.
 */
export function FieldError({ message }: { message?: unknown }) {
  if (typeof message !== "string" || message.length === 0) return null;
  return <p className="text-destructive text-sm">{message}</p>;
}
