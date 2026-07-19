import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-xl2 px-6 py-12 text-center">
      <div className="text-corgi-text" aria-hidden>
        {icon ?? <Inbox size={40} />}
      </div>
      <h2 className="text-lg font-semibold text-ivory">{title}</h2>
      {description ? (
        <p className="max-w-sm text-sm text-ivory/70">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
