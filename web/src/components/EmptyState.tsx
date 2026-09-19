import type { ReactNode } from "react";

type EmptyStateProps = {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] bg-paper-lift p-10 text-center ring-1 ring-rule shadow-print sm:p-16">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-paper-deep text-3xl"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 text-graphite">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
