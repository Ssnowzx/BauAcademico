import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 space-y-8">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="BaúAcadêmico"
            className="w-24 h-24 object-contain rounded-full ring-2 ring-primary/20 p-2 bg-card/50 backdrop-blur-sm"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            BaúAcadêmico
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed px-4">
            Armazene e gerencie seus comprovantes acadêmicos com segurança.
          </p>
        </div>

        {/* CTA Button with custom borders */}
        <Button
          onClick={() => navigate("/login")}
          size="lg"
          className="bg-gradient-cosmic hover:shadow-glow text-white font-semibold px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
          style={{
            borderTop: "1px solid oklch(0.65 0.28 303.9)",
            borderLeft: "1px solid oklch(0.65 0.28 303.9)",
            borderRight: "6px solid oklch(0.65 0.28 303.9)",
            borderBottom: "6px solid oklch(0.65 0.28 303.9)",
            borderRadius: "0.75rem",
            boxShadow:
              "0 6px 16px color-mix(in oklch, oklch(0.65 0.28 303.9), transparent 65%)",
          }}
        >
          Entrar no Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;
