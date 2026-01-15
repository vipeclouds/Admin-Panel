import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : variant === "danger"
        ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
