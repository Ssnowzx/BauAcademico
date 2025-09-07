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
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4">
      {/* Container central com espaçamento menor para uma aparência mais compacta */}
      <div className="text-center space-y-2 max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center">
          {/* Logo mantida grande (4x) — aproximar o texto sem reduzir a imagem */}
          <img
            src="/logo.png"
            alt="BaúAcadêmico"
            className="w-96 h-96 sm:w-72 sm:h-72 max-w-full object-contain block -mb-8 sm:-mb-12 md:-mb-16"
          />
        </div>

        {/* Title */}
        <div className="space-y-1 -mt-6 sm:-mt-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            BaúAcadêmico
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-snug px-6 max-w-xl mx-auto -mt-1">
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
