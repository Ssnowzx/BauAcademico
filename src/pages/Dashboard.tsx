import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import {
  FileText,
  Bell,
  LogOut,
  Award,
  GraduationCap,
  Receipt,
  Settings,
  Newspaper,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuOptions = [
    {
      title: "APC",
      description: "Atividades Práticas Curriculares",
      icon: Award,
      path: "/documents/apc",
      gradient: "bg-gradient-chart-1",
    },
    {
      title: "ACE",
      description: "Atividades Complementares de Ensino",
      icon: GraduationCap,
      path: "/documents/ace",
      gradient: "bg-gradient-chart-2",
    },
    {
      title: "RECIBOS",
      description: "Comprovantes de Mensalidade",
      icon: Receipt,
      path: "/documents/recibos",
      gradient: "bg-gradient-chart-3",
    },
    {
      title: "AVISOS",
      description: "Comunicados e Notícias",
      icon: Bell,
      path: "/avisos",
      gradient: "bg-gradient-destructive",
    },
    {
      title: "NOTÍCIAS",
      description: "Últimas notícias e atualizações",
      icon: Newspaper,
      path: "/noticias",
      gradient: "bg-gradient-cosmic",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div
        className="bg-card shadow-sm mx-5 mt-4 mb-6"
        style={{
          borderRadius: "0.75rem",
          borderTop: "1px solid oklch(0.65 0.28 303.9)",
          borderLeft: "1px solid oklch(0.65 0.28 303.9)",
          borderRight: "3px solid oklch(0.65 0.28 303.9)",
          borderBottom: "3px solid oklch(0.65 0.28 303.9)",
          boxShadow:
            "0 4px 12px color-mix(in oklch, oklch(0.65 0.28 303.9), transparent 75%)",
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <img
                src="/logoinicio.png"
                alt="BaúAcadêmico"
                className="w-10 h-10 object-contain rounded-full ring-1 ring-white/6 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold truncate text-foreground">
                  BaúAcadêmico
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Bem-vindo, {user?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {user?.is_admin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="border-primary/20 hover:bg-primary/5 text-primary text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive/20 hover:bg-destructive/5 text-destructive text-xs sm:text-sm px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base px-4">
            Escolha uma das opções abaixo para gerenciar seus documentos
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {menuOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.title}
                className="group cursor-pointer transition-shadow duration-300 hover:shadow-cosmic shadow-lg"
                style={{
                  borderTop: "1px solid oklch(0.65 0.28 303.9)",
                  borderLeft: "1px solid oklch(0.65 0.28 303.9)",
                  borderRight: "6px solid oklch(0.65 0.28 303.9)",
                  borderBottom: "6px solid oklch(0.65 0.28 303.9)",
                  borderRadius: "0.75rem",
                  boxShadow:
                    "0 6px 16px color-mix(in oklch, oklch(0.65 0.28 303.9), transparent 65%)",
                }}
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 ${option.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">
                      {option.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12 text-center px-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sistema de gestão de comprovantes acadêmicos com OCR automático
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
