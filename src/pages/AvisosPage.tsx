import React, { useState, useEffect } from "react";
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
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Calendar,
  Plus,
  FileText,
  Download,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/date-utils";
import { useAuth } from "@/contexts/useAuth";

interface FileData {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface Aviso {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  files?: FileData[];
  // Campos legados para compatibilidade
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
}

const AvisosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvisos();
  }, []);

  const loadAvisos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("avisos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Avisos carregados na página pública:", data);
      const avisosData = (data as Aviso[]) || [];
      avisosData.forEach((aviso, index) => {
        console.log(`Aviso ${index + 1}:`, {
          id: aviso.id,
          title: aviso.title,
          files: aviso.files,
          file_url: aviso.file_url, // legado
        });
      });

      setAvisos(avisosData);
    } catch (error) {
      console.error("Error loading avisos:", error);
      toast.error("Erro ao carregar avisos");
    } finally {
      setLoading(false);
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="border-primary/20 hover:bg-primary/5 text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Bell className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Avisos</h1>
                <p className="text-xs text-muted-foreground">
                  Comunicados e notícias importantes
                </p>
              </div>
            </div>
            {user?.is_admin && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : avisos.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nenhum aviso encontrado"
            description="Não há avisos disponíveis no momento"
          />
        ) : (
          <div className="space-y-6">
            {avisos.map((aviso) => (
              <Card
                key={aviso.id}
                className="hover:shadow-cosmic transition-shadow duration-300"
                style={{
                  borderTop: "1px solid oklch(0.627 0.265 303.9)",
                  borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                  borderRight: "4px solid oklch(0.627 0.265 303.9)",
                  borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{aviso.title}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDateTime(aviso.created_at)}
                      </CardDescription>
                    </div>
                    <div className="w-10 h-10 bg-gradient-destructive rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aviso.image_url && (
                    <div>
                      <a
                        href={aviso.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
                          <img
                            src={aviso.image_url}
                            alt={aviso.title}
                            className="w-full object-contain max-h-[60vh] rounded-lg"
                          />
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Múltiplos arquivos (novo formato) */}
                  {aviso.files && aviso.files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-destructive" />
                        Arquivos para Download ({aviso.files.length})
                      </h4>
                      {aviso.files.map((file, index) => (
                        <div
                          key={index}
                          className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-10 h-10 bg-destructive-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-destructive" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">
                                  {file.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {file.type} • {Math.round(file.size / 1024)}KB
                                </p>
                              </div>
                            </div>
                            <a
                              href={file.url}
                              download={file.name}
                              className="flex-shrink-0"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-destructive-30 text-destructive hover:bg-destructive-10 hover:border-destructive-50 w-full sm:w-auto"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Arquivo único (formato legado para compatibilidade) */}
                  {aviso.file_url &&
                    (!aviso.files || aviso.files.length === 0) && (
                      <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-destructive-10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm truncate">
                                {aviso.file_name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {aviso.file_type} •{" "}
                                {aviso.file_size
                                  ? Math.round(aviso.file_size / 1024)
                                  : 0}
                                KB
                              </p>
                            </div>
                          </div>
                          <a
                            href={aviso.file_url}
                            download={aviso.file_name}
                            className="flex-shrink-0"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive-30 text-destructive hover:bg-destructive-10 hover:border-destructive-50 w-full sm:w-auto"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  {aviso.description && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {aviso.description}
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

export default AvisosPage;
