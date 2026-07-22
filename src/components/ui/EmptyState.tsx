import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-5 py-10">
      <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mb-5 text-card-2">
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg mb-1.5">{title}</h3>
      <p className="text-text-2 text-sm max-w-[220px] mb-5">{description}</p>
      {action}
    </div>
  );
}
