import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";

/**
 * Shared admin primitives.
 *
 * The admin screens were written for a dark theme (zinc-800 inputs, white text)
 * while the shell renders light, so every field was a dark box with white text
 * on a white page and the primary button was white-on-white. These wrap the
 * product's own tokens so every admin screen looks like one tool.
 */

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle ? <div className="mt-1 text-sm text-muted">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminField({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none disabled:opacity-60";

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, props.className)} />;
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "resize-y leading-relaxed", props.className)} />;
}

type ButtonTone = "primary" | "secondary" | "quiet" | "danger";

const TONE: Record<ButtonTone, string> = {
  primary: "bg-primary text-white hover:opacity-90",
  secondary: "border border-line bg-paper text-ink hover:border-primary",
  quiet: "text-muted hover:text-ink",
  danger: "border border-red-300 text-red-700 hover:bg-red-50",
};

export function AdminButton({
  tone = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-control px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        TONE[tone],
        className,
      )}
    />
  );
}

export function AdminNotice({
  tone,
  children,
}: {
  tone: "error" | "success" | "warning" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-300 bg-red-50 text-red-800",
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    info: "border-line bg-surface-low text-ink",
  }[tone];
  return (
    <div className={cn("rounded-surface border px-4 py-3 text-sm", styles)} role="status">
      {children}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
