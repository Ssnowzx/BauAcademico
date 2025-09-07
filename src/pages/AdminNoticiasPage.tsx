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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { ArrowLeft, Plus, Trash2, Edit, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { formatDateTimeShort } from "@/lib/date-utils";

interface Noticia {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

const AdminNoticiasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Noticia | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
  });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/dashboard");
      return;
    }
    loadNoticias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Função para garantir URL de imagem funcional no Chrome
  const getImageUrl = (url: string | null) => {
    if (!url) return null;

    // Se já é uma URL completa (http/https ou data:base64), retorna direto
    if (url.startsWith("http") || url.startsWith("data:")) {
      // Se é URL do Supabase e não tem timestamp, adiciona um para Chrome
      if (url.includes("supabase.co") && !url.includes("?t=")) {
        return `${url}?t=${Date.now()}&cache=no-cache`;
      }
      return url;
    }

    // Se é um path do Supabase Storage, gera URL pública
    try {
      const { data } = supabase.storage.from("noticias").getPublicUrl(url);
      // Força reload no Chrome adicionando timestamp
      return `${data.publicUrl}?t=${Date.now()}&cache=no-cache`;
    } catch (error) {
      console.warn("Erro ao gerar URL da imagem:", error);
      return url;
    }
  };

  const loadNoticias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNoticias(data || []);
    } catch (err) {
      console.error("Error loading noticias:", err);
      toast.error("Erro ao carregar notícias");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = null;

      if (formData.image) {
        const fileExt = formData.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("noticias")
          .upload(filePath, formData.image, {
            cacheControl: "3600", // Cache por 1 hora
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Mensagem clara quando o bucket não existe
          if (
            uploadError?.message?.toLowerCase()?.includes("bucket not found")
          ) {
            toast.error(
              "Bucket 'noticias' não encontrado. Crie o bucket no painel do Supabase (Storage → Buckets)."
            );
            setSubmitting(false);
            return;
          }

          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("noticias").getPublicUrl(filePath);

        // Salvar URL limpa no banco (sem timestamp)
        imageUrl = publicUrl;
        console.log("Image uploaded successfully:", imageUrl);
      }

      if (editing) {
        const updateData: Partial<Noticia> & { image_url?: string } = {
          title: formData.title,
          description: formData.description,
        };
        if (imageUrl) updateData.image_url = imageUrl;

        const { error } = await supabase
          .from("noticias")
          .update(updateData)
          .eq("id", editing.id);

        if (error) throw error;
        toast.success("Notícia atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("noticias").insert({
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast.success("Notícia criada com sucesso!");
      }

      setFormData({ title: "", description: "", image: null });
      setEditing(null);
      loadNoticias();
    } catch (err) {
      console.error("Error saving noticia:", err);
      toast.error("Erro ao salvar notícia");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (n: Noticia) => {
    setEditing(n);
    setFormData({
      title: n.title,
      description: n.description || "",
      image: null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;
    try {
      const { error } = await supabase.from("noticias").delete().eq("id", id);
      if (error) throw error;
      setNoticias(noticias.filter((x) => x.id !== id));
      toast.success("Notícia excluída com sucesso");
    } catch (err) {
      console.error("Error deleting noticia:", err);
      toast.error("Erro ao excluir notícia");
    }
  };

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Icon and title */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-cosmic rounded-xl flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  Gerenciar Notícias
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Criar, editar e remover notícias
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card className="shadow-lg shadow-cosmic/20 border-vibrant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {editing ? "Editar Notícia" : "Nova Notícia"}
                </CardTitle>
                <CardDescription>
                  {editing
                    ? "Atualize as informações da notícia"
                    : "Crie uma nova notícia para exibir no feed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Digite o título da notícia"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, title: e.target.value }))
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Texto da notícia"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      disabled={submitting}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Imagem (opcional)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          // Validar formato de arquivo
                          const validFormats = [
                            "image/jpeg",
                            "image/jpg",
                            "image/png",
                            "image/gif",
                            "image/webp",
                          ];
                          if (!validFormats.includes(file.type)) {
                            toast.error(
                              "Formato não suportado. Use JPG, PNG, GIF ou WebP"
                            );
                            e.target.value = "";
                            return;
                          }

                          // Validar tamanho (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Arquivo muito grande. Máximo 5MB");
                            e.target.value = "";
                            return;
                          }
                        }
                        setFormData((p) => ({ ...p, image: file }));
                      }}
                      disabled={submitting}
                      className="file:text-primary-foreground file:bg-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos suportados: JPG, PNG, GIF, WebP • Máximo: 5MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
                      disabled={submitting || !formData.title.trim()}
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Salvando...
                        </>
                      ) : editing ? (
                        "Atualizar Notícia"
                      ) : (
                        "Criar Notícia"
                      )}
                    </Button>
                    {editing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(null);
                          setFormData({
                            title: "",
                            description: "",
                            image: null,
                          });
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-lg shadow-cosmic/20 border-vibrant">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Newspaper className="w-5 h-5 mr-2" />
                    Notícias Cadastradas
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {noticias.length} notícias
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : noticias.length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhuma notícia cadastrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {noticias.map((n) => (
                      <div
                        key={n.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium line-clamp-1">
                            {n.title}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(n)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(n.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {n.image_url && (
                          <div className="mb-2">
                            <img
                              src={getImageUrl(n.image_url) || ""}
                              alt={n.title}
                              className="w-full h-32 object-cover rounded-md"
                              loading="lazy"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.warn(
                                  "Erro ao carregar imagem no admin:",
                                  n.image_url
                                );
                                // Fallback: tentar URL original
                                const target = e.target as HTMLImageElement;
                                if (target.src !== n.image_url) {
                                  target.src = n.image_url;
                                }
                              }}
                            />
                          </div>
                        )}
                        {n.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {n.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeShort(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNoticiasPage;
