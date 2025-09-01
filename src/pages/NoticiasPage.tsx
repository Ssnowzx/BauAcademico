import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Newspaper, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface Noticia {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

const NoticiasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);

  useEffect(() => {
    loadNoticias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNoticias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNoticias(data || []);
    } catch (err: any) {
      console.error("Error loading noticias:", err);
      // Supabase returns PGRST205 when the table is not present in the schema cache
      if (err?.code === "PGRST205") {
        setMissingTable(true);
        toast.error(
          "Tabela 'noticias' não encontrada no banco. Rode a migração."
        );
      } else {
        toast.error("Erro ao carregar notícias");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {missingTable && (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="p-4 rounded-md bg-destructive/6 border border-destructive/10 text-destructive">
            <strong>Tabela 'noticias' não encontrada.</strong>
            <div className="text-sm">
              Abra o painel do Supabase e execute a migração SQL para criar a
              tabela <code>public.noticias</code>. Ver README ou contate o
              administrador.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button, icon, title */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  Notícias
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Últimas notícias do BaúAcadêmico
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {user?.is_admin && (
                <Button
                  onClick={() => navigate("/admin/noticias")}
                  className="bg-gradient-cosmic hover:shadow-glow transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Gerenciar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : noticias.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-muted-foreground">
              Não há notícias disponíveis no momento
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {noticias.map((n) => (
              <Card
                key={n.id}
                className="hover:shadow-cosmic transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{n.title}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(
                          new Date(n.created_at),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {n.image_url && (
                    <div>
                      <a
                        href={n.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
                          <img
                            src={n.image_url}
                            alt={n.title}
                            className="w-full object-contain max-h-[60vh] rounded-lg"
                          />
                        </div>
                      </a>
                    </div>
                  )}
                  {n.description && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {n.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiasPage;
