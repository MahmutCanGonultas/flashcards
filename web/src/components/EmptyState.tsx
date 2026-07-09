import type { ReactNode } from "react";

type EmptyStateProps = {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl bg-white border-2 border-dashed border-stone-200 p-10 sm:p-16 text-center">
      <div className="text-5xl mb-3" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="font-bold text-lg text-stone-800">{title}</h3>
      <p className="text-stone-500 mt-1">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
