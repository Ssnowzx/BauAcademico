import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  backTo?: string;
  rightAction?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  icon: Icon,
  backTo = "/dashboard",
  rightAction,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b bg-card shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button, icon, title */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backTo)}
              className="text-xs sm:text-sm flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {description}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          {rightAction && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
