import React, { useEffect, useState, useRef } from "react";
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
import { Calendar, Newspaper, Plus, Eye } from "lucide-react";
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
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
  const [imageLoadingState, setImageLoadingState] = useState<
    Map<string, "loading" | "loaded" | "error">
  >(new Map());
  const [imageRetryCount, setImageRetryCount] = useState<Map<string, number>>(
    new Map()
  );

  // Ref para manter as blob URLs ativas durante toda a vida do componente
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadNoticias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para pré-carregar imagens
  const preloadImage = async (imageUrl: string) => {
    if (
      !imageUrl ||
      imageLoadingState.get(imageUrl) === "loading" ||
      imageLoadingState.get(imageUrl) === "loaded"
    ) {
      return;
    }

    setImageLoadingState((prev) => new Map(prev.set(imageUrl, "loading")));

    try {
      const cachedUrl = await getImageUrl(imageUrl);
      if (cachedUrl) {
        // Pré-carregar a imagem
        const img = new Image();
        img.onload = () => {
          setImageLoadingState((prev) => new Map(prev.set(imageUrl, "loaded")));
        };
        img.onerror = () => {
          console.error("Erro ao pré-carregar imagem:", cachedUrl);
          setImageLoadingState((prev) => new Map(prev.set(imageUrl, "error")));
        };
        img.src = cachedUrl;
      }
    } catch (error) {
      console.error("Erro no preloadImage:", error);
      setImageLoadingState((prev) => new Map(prev.set(imageUrl, "error")));
    }
  };

  // Pre-carregar imagens quando notícias são carregadas
  useEffect(() => {
    if (noticias.length > 0) {
      noticias.forEach((noticia) => {
        if (noticia.image_url && !imageCache.has(noticia.image_url)) {
          preloadImage(noticia.image_url);
        }
      });
    }
  }, [noticias]);

  // Cleanup: liberar blob URLs quando componente for desmontado
  useEffect(() => {
    return () => {
      // Liberar todas as blob URLs criadas
      blobUrlsRef.current.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      blobUrlsRef.current.clear();
    };
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

  // Função para garantir URL de imagem funcional no Chrome
  const getImageUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;

    // Check cache first
    if (imageCache.has(url)) {
      const cachedUrl = imageCache.get(url);
      // Verificar se a blob URL ainda é válida
      if (
        cachedUrl &&
        cachedUrl.startsWith("blob:") &&
        !blobUrlsRef.current.has(cachedUrl)
      ) {
        // Blob URL foi revogada, remover do cache
        setImageCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(url);
          return newCache;
        });
      } else {
        return cachedUrl || null;
      }
    }

    try {
      let finalUrl = url;

      // Se não é uma URL completa, gera URL pública do Supabase
      if (!url.startsWith("http") && !url.startsWith("data:")) {
        const { data } = supabase.storage.from("noticias").getPublicUrl(url);
        finalUrl = data.publicUrl;
      }

      // Verificar se é um formato suportado pelo Chrome
      const isUnsupportedFormat =
        finalUrl.toLowerCase().includes(".heic") ||
        finalUrl.toLowerCase().includes(".heif");

      if (isUnsupportedFormat) {
        console.warn("Formato HEIC/HEIF não suportado pelo Chrome:", finalUrl);
        // Para formatos não suportados, retornar a URL original e deixar o navegador decidir
        setImageCache((prev) => new Map(prev.set(url, finalUrl)));
        return finalUrl;
      }

      // Para Chrome: fazer fetch da imagem e converter para blob URL
      const response = await fetch(finalUrl, {
        mode: "cors",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Registrar a blob URL para posterior limpeza
      blobUrlsRef.current.add(blobUrl);

      // Cache the blob URL
      setImageCache((prev) => new Map(prev.set(url, blobUrl)));

      return blobUrl;
    } catch (error) {
      console.warn("Erro ao processar imagem, usando URL direta:", error);

      // Fallback: retornar URL original
      let fallbackUrl = url;
      if (!url.startsWith("http") && !url.startsWith("data:")) {
        const { data } = supabase.storage.from("noticias").getPublicUrl(url);
        fallbackUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      setImageCache((prev) => new Map(prev.set(url, fallbackUrl)));
      return fallbackUrl;
    }
  };

  // Função síncrona para uso imediato (com cache)
  const getImageUrlSync = (url: string | null): string | null => {
    if (!url) return null;

    // Se já está no cache, retorna
    if (imageCache.has(url)) {
      const cachedUrl = imageCache.get(url);
      // Verificar se a blob URL ainda é válida
      if (
        cachedUrl &&
        cachedUrl.startsWith("blob:") &&
        !blobUrlsRef.current.has(cachedUrl)
      ) {
        // Blob URL foi revogada, remover do cache e tentar novamente
        setImageCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(url);
          return newCache;
        });
        getImageUrl(url); // Recarregar
      } else {
        return cachedUrl || null;
      }
    }

    // Se não está no cache, inicia o carregamento assíncrono
    getImageUrl(url);

    // Retorna URL temporária enquanto carrega
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    } else {
      const { data } = supabase.storage.from("noticias").getPublicUrl(url);
      return `${data.publicUrl}?t=${Date.now()}`;
    }
  };

  // Função para tentar novamente o carregamento de uma imagem
  const retryImage = async (imageUrl: string) => {
    const currentRetries = imageRetryCount.get(imageUrl) || 0;
    if (currentRetries >= 3) {
      console.warn("Máximo de tentativas excedido para:", imageUrl);
      return;
    }

    setImageRetryCount(
      (prev) => new Map(prev.set(imageUrl, currentRetries + 1))
    );

    // Remover do cache para forçar nova tentativa
    setImageCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(imageUrl);
      return newCache;
    });

    // Tentar carregar novamente
    await preloadImage(imageUrl);
  };

  const truncateDescription = (
    text: string | null,
    maxLength: number = 150
  ) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
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
      <PageHeader
        title="Notícias"
        description="Últimas notícias do BaúAcadêmico"
        icon={Newspaper}
        rightAction={
          user?.is_admin ? (
            <Button
              onClick={() => navigate("/admin/noticias")}
              variant="outline"
              className="border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
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
        ) : noticias.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Nenhuma notícia encontrada"
            description="Não há notícias disponíveis no momento"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticias.map((n) => (
              <Card
                key={n.id}
                className="group hover:shadow-cosmic transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedNoticia(n)}
              >
                {/* Image Preview */}
                {n.image_url && (
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                    <img
                      src={getImageUrlSync(n.image_url) || ""}
                      alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        console.log(
                          "Imagem carregada com sucesso:",
                          n.image_url
                        );
                        // Remover placeholder se existir
                        const placeholder = (e.target as HTMLElement)
                          .nextElementSibling;
                        if (
                          placeholder?.classList.contains(
                            "image-error-placeholder"
                          )
                        ) {
                          placeholder.remove();
                        }
                      }}
                      onError={(e) => {
                        console.error("Erro ao carregar imagem:", n.image_url);
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement;

                        // Verificar se é formato não suportado
                        const isUnsupportedFormat =
                          n.image_url?.toLowerCase().includes(".heic") ||
                          n.image_url?.toLowerCase().includes(".heif");

                        // Mostrar placeholder apropriado
                        if (
                          container &&
                          !container.querySelector(".image-error-placeholder")
                        ) {
                          const placeholder = document.createElement("div");
                          placeholder.className =
                            "image-error-placeholder absolute inset-0 flex items-center justify-center bg-muted/80 text-muted-foreground text-sm";

                          if (isUnsupportedFormat) {
                            placeholder.innerHTML = `
                              <div class="text-center">
                                <div class="w-12 h-12 mx-auto mb-2 opacity-50">📷</div>
                                <div>Formato não suportado</div>
                                <div class="text-xs mt-1">HEIC/HEIF</div>
                                <button class="text-xs text-primary hover:underline mt-1" onclick="window.location.reload()">
                                  Abrir em navegador compatível
                                </button>
                              </div>
                            `;
                          } else {
                            placeholder.innerHTML = `
                              <div class="text-center">
                                <div class="w-12 h-12 mx-auto mb-2 opacity-50">⚠️</div>
                                <div>Erro ao carregar</div>
                                <button class="text-xs text-primary hover:underline mt-1" onclick="this.parentElement.parentElement.parentElement.dispatchEvent(new CustomEvent('retry-image'))">
                                  Tentar novamente
                                </button>
                              </div>
                            `;
                          }

                          container.appendChild(placeholder);
                        }

                        // Setup retry handler
                        if (container && !container.dataset.retrySetup) {
                          container.dataset.retrySetup = "true";
                          container.addEventListener("retry-image", () => {
                            if (n.image_url) {
                              retryImage(n.image_url);
                              // Remove placeholder
                              const placeholder = container.querySelector(
                                ".image-error-placeholder"
                              );
                              if (placeholder) placeholder.remove();
                              // Reset image
                              target.src = getImageUrlSync(n.image_url) || "";
                            }
                          });
                        }
                      }}
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {n.title}
                  </CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(n.created_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {n.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {truncateDescription(n.description)}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-primary font-medium">
                    <Eye className="w-3 h-3 mr-1" />
                    Ler mais
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Notícia Completa */}
      {selectedNoticia && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <h2 className="text-xl font-bold">{selectedNoticia.title}</h2>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(
                      new Date(selectedNoticia.created_at),
                      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedNoticia(null)}
                  className="flex-shrink-0 ml-4"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {selectedNoticia.image_url && (
                <div className="rounded-lg overflow-hidden relative">
                  <img
                    src={getImageUrlSync(selectedNoticia.image_url) || ""}
                    alt={selectedNoticia.title}
                    className="w-full object-contain max-h-[50vh] rounded-lg"
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      console.log(
                        "Imagem do modal carregada:",
                        selectedNoticia.image_url
                      );
                      // Remover placeholder se existir
                      const placeholder = (e.target as HTMLElement)
                        .nextElementSibling;
                      if (
                        placeholder?.classList.contains(
                          "image-error-placeholder"
                        )
                      ) {
                        placeholder.remove();
                      }
                    }}
                    onError={(e) => {
                      console.error(
                        "Erro ao carregar imagem no modal:",
                        selectedNoticia.image_url
                      );
                      const target = e.target as HTMLImageElement;
                      const container = target.parentElement;

                      // Verificar se é formato não suportado
                      const isUnsupportedFormat =
                        selectedNoticia.image_url
                          ?.toLowerCase()
                          .includes(".heic") ||
                        selectedNoticia.image_url
                          ?.toLowerCase()
                          .includes(".heif");

                      // Mostrar placeholder de erro
                      if (
                        container &&
                        !container.querySelector(".image-error-placeholder")
                      ) {
                        const placeholder = document.createElement("div");
                        placeholder.className =
                          "image-error-placeholder absolute inset-0 flex items-center justify-center bg-muted/80 text-muted-foreground rounded-lg";

                        if (isUnsupportedFormat) {
                          placeholder.innerHTML = `
                            <div class="text-center p-8">
                              <div class="w-16 h-16 mx-auto mb-4 opacity-50 text-4xl">📷</div>
                              <div class="text-lg mb-2">Formato não suportado pelo Chrome</div>
                              <div class="text-sm">Este arquivo está no formato HEIC/HEIF</div>
                              <div class="text-xs mt-4 text-muted-foreground">
                                Tente abrir no Safari ou converter para JPG/PNG
                              </div>
                              <button class="mt-3 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90" onclick="window.location.reload()">
                                Recarregar página
                              </button>
                            </div>
                          `;
                        } else {
                          placeholder.innerHTML = `
                            <div class="text-center p-8">
                              <div class="w-16 h-16 mx-auto mb-4 opacity-50 text-4xl">⚠️</div>
                              <div class="text-lg mb-2">Erro ao carregar imagem</div>
                              <div class="text-sm text-muted-foreground mb-4">
                                A imagem não pôde ser carregada
                              </div>
                              <button class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90" onclick="this.parentElement.parentElement.parentElement.dispatchEvent(new CustomEvent('retry-modal-image'))">
                                Tentar novamente
                              </button>
                            </div>
                          `;
                        }

                        container.appendChild(placeholder);
                      }

                      // Setup retry handler for modal
                      if (container && !container.dataset.retrySetup) {
                        container.dataset.retrySetup = "true";
                        container.addEventListener("retry-modal-image", () => {
                          if (selectedNoticia.image_url) {
                            retryImage(selectedNoticia.image_url);
                            // Remove placeholder
                            const placeholder = container.querySelector(
                              ".image-error-placeholder"
                            );
                            if (placeholder) placeholder.remove();
                            // Reset image
                            target.src =
                              getImageUrlSync(selectedNoticia.image_url) || "";
                          }
                        });
                      }
                    }}
                  />
                </div>
              )}
              {selectedNoticia.description && (
                <div className="prose max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedNoticia.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticiasPage;
