import type { ReactNode } from "react";

type EmptyStateProps = {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-3d rounded-[24px] p-8 text-center sm:p-14">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sunny-soft text-3xl"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <h3 className="mt-4 text-[22px] font-black tracking-tight text-ink">{title}</h3>
      <p className="mt-1 font-semibold text-graphite">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
