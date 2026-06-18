/** One-time author prompt for surfaces with no Access identity (local dev). */
export function NameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your name (shown with your comments)"
      className="mb-2 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    />
  );
}
