import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 hero-container">
      <div className="hero-content">
        <img src="/logo.png" alt="BaúAcadêmico" className="brand-image" />
        <h1
          className="text-4xl font-bold"
          style={{ color: "hsl(var(--foreground))" }}
        >
          BaúAcadêmico
        </h1>
        <p className="hero-tagline">
          Armazene e gerencie seus comprovantes acadêmicos com segurança.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="btn-cta cta-pill mx-auto"
        >
          Entrar no Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;
