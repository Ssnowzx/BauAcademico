import React from "react";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
