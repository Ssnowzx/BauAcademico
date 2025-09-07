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
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      hoverColor: "group-hover:text-emerald-700",
      hoverBg: "group-hover:bg-emerald-100",
    },
    {
      title: "ACE",
      description: "Atividades Complementares de Ensino",
      icon: GraduationCap,
      path: "/documents/ace",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "group-hover:text-blue-700",
      hoverBg: "group-hover:bg-blue-100",
    },
    {
      title: "RECIBOS",
      description: "Comprovantes de Mensalidade",
      icon: Receipt,
      path: "/documents/recibos",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      hoverColor: "group-hover:text-amber-700",
      hoverBg: "group-hover:bg-amber-100",
    },
    {
      title: "PROVAS / TRABALHOS",
      description: "Notas e comprovantes acadêmicos (Provas e Trabalhos)",
      icon: FileText,
      path: "/documents/provas",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "group-hover:text-purple-700",
      hoverBg: "group-hover:bg-purple-100",
    },
    {
      title: "AVISOS",
      description: "Comunicados e Notícias",
      icon: Bell,
      path: "/avisos",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      hoverColor: "group-hover:text-rose-700",
      hoverBg: "group-hover:bg-rose-100",
    },
    {
      title: "NOTÍCIAS",
      description: "Últimas notícias e atualizações",
      icon: Newspaper,
      path: "/noticias",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      hoverColor: "group-hover:text-indigo-700",
      hoverBg: "group-hover:bg-indigo-100",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header - Rounded and Suspended */}
      <div className="mx-2 mt-2 mb-6">
        <div
          className="bg-card shadow-lg px-3 py-2 sm:px-6 sm:py-3"
          style={{
            borderTop: "1px solid oklch(0.627 0.265 303.9)",
            borderLeft: "1px solid oklch(0.627 0.265 303.9)",
            borderRight: "4px solid oklch(0.627 0.265 303.9)",
            borderBottom: "4px solid oklch(0.627 0.265 303.9)",
            borderRadius: "0.75rem",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 -ml-4 sm:-ml-8">
              <img
                src="/logo.png"
                alt="BaúAcadêmico"
                className="w-20 h-20 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain"
              />
              <div className="min-w-0 flex-1 -ml-3 sm:-ml-4">
                <h1 className="text-lg sm:text-2xl font-bold truncate">
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
                  className="border-primary/20 hover:bg-primary/5 text-primary hidden sm:flex"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              {user?.is_admin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="border-primary/20 hover:bg-primary/5 text-primary sm:hidden p-2"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive/20 hover:bg-destructive/5 text-destructive hidden sm:flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive/20 hover:bg-destructive/5 text-destructive sm:hidden p-2"
              >
                <LogOut className="w-4 h-4" />
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {menuOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.title}
                className="group cursor-pointer transition-shadow duration-300 hover:shadow-cosmic shadow-lg"
                style={{
                  borderTop: "1px solid oklch(0.627 0.265 303.9)",
                  borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                  borderRight: "4px solid oklch(0.627 0.265 303.9)",
                  borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                }}
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-3 sm:p-6 text-center space-y-2 sm:space-y-4">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-20 sm:h-20 ${option.bgColor} ${option.hoverBg} rounded-2xl flex items-center justify-center transition-all duration-300 border border-white/20 shadow-sm group-hover:shadow-md group-hover:scale-105`}
                    role="img"
                    aria-hidden="true"
                  >
                    <Icon
                      strokeWidth={1.5}
                      className={`w-6 h-6 sm:w-10 sm:h-10 ${option.color} ${option.hoverColor} transition-all duration-300`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg mb-1">
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
