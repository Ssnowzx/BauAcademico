import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
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
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "ACE",
      description: "Atividades Complementares de Ensino",
      icon: GraduationCap,
      path: "/documents/ace",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "RECIBOS",
      description: "Comprovantes de Mensalidade",
      icon: Receipt,
      path: "/documents/recibos",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "AVISOS",
      description: "Comunicados e Notícias",
      icon: Bell,
      path: "/avisos",
      gradient: "from-red-500 to-red-600",
    },
    {
      title: "NOTÍCIAS",
      description: "Últimas notícias e atualizações",
      icon: Newspaper,
      path: "/noticias",
      gradient: "from-cyan-500 to-fuchsia-500",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <img
                src="/logoinicio.png"
                alt="BaúAcadêmico"
                className="w-10 h-10 object-contain rounded-full ring-1 ring-white/6 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1
                  className="text-lg sm:text-xl font-bold truncate"
                  style={{ color: "hsl(var(--foreground))" }}
                >
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
                  className="border-primary/20 hover:bg-primary/5 text-xs sm:text-sm px-2 sm:px-3"
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
                className="group cursor-pointer transition-all duration-300 hover:shadow-cosmic hover:scale-105 border-0 shadow-lg"
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300`}
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
