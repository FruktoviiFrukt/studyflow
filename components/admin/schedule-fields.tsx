import type { ReactNode, SelectHTMLAttributes } from "react";

export const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <Field label={label}>
      <select aria-label={label} {...props} className={fieldClass}>
        {children}
      </select>
    </Field>
  );
}
