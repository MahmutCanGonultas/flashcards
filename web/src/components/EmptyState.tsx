import type { ReactNode } from "react";

type EmptyStateProps = {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-b from-white to-stone-50 ring-2 ring-stone-100 shadow-[0_5px_0_0_var(--color-stone-100)] p-10 sm:p-16 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-3xl"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-tight text-stone-800">{title}</h3>
      <p className="text-stone-500 mt-1">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
