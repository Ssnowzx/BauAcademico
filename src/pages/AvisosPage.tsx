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
import { Bell, Calendar, Plus, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

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
      const avisosData = data as Aviso[] || [];
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
      {/* Header */}
      <PageHeader
        title="Avisos"
        description="Comunicados e notícias importantes"
        icon={Bell}
        rightAction={
          user?.is_admin ? (
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Gerenciar</span>
            </Button>
          ) : undefined
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                className="hover:shadow-cosmic transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{aviso.title}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(
                          new Date(aviso.created_at),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </CardDescription>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
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
                        <FileText className="w-4 h-4 text-red-500" />
                        Arquivos para Download ({aviso.files.length})
                      </h4>
                      {aviso.files.map((file, index) => (
                        <div key={index} className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-500" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm truncate max-w-[200px]">
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
                              className="ml-4"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
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
                  {aviso.file_url && (!aviso.files || aviso.files.length === 0) && (
                    <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
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
                          className="ml-4"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
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
