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
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Edit,
  Bell,
  FileText,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    files: [] as File[], // Array de arquivos PDF
  });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/dashboard");
      return;
    }
    loadAvisos();
  }, [user, navigate]);

  const loadAvisos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("avisos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("📥 Avisos carregados:", data?.length || 0);

      const avisosData = (data as Aviso[]) || [];
      setAvisos(avisosData);
    } catch (error) {
      console.error("Error loading avisos:", error);
      toast.error("Erro ao carregar avisos");
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

      console.log("Tentando salvar aviso:", {
        title: formData.title,
        description: formData.description,
      });
      console.log("Usuário atual:", user);

      // Upload image if provided
      if (formData.image) {
        const fileExt = formData.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avisos")
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avisos").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Upload multiple files if provided
      const uploadedFiles: FileData[] = [];

      if (formData.files && formData.files.length > 0) {
        console.log(
          "📤 Iniciando upload de",
          formData.files.length,
          "arquivos"
        );

        for (let i = 0; i < formData.files.length; i++) {
          const file = formData.files[i];
          const fileExt = file.name.split(".").pop();
          const uploadFileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}.${fileExt}`;
          const filePath = `files/${uploadFileName}`;
          let fileUrl: string;

          try {
            const { error: uploadError } = await supabase.storage
              .from("avisos")
              .upload(filePath, file);

            if (uploadError) {
              console.warn(`⚠️ Upload falhou para ${file.name}, usando base64`);
              // Fallback para base64
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              fileUrl = base64;
            } else {
              const {
                data: { publicUrl },
              } = supabase.storage.from("avisos").getPublicUrl(filePath);
              fileUrl = publicUrl;
            }
          } catch (error) {
            console.error(`❌ Erro ao fazer upload de ${file.name}:`, error);
            // Fallback para base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            fileUrl = base64;
          }

          const processedFile = {
            url: fileUrl,
            name: file.name,
            type: file.type,
            size: file.size,
          };

          uploadedFiles.push(processedFile);
        }

        console.log(
          "✅ Upload concluído:",
          uploadedFiles.length,
          "arquivos processados"
        );
      }

      if (editingAviso) {
        // Update existing aviso
        const updateData: any = {
          title: formData.title,
          description: formData.description,
        };

        if (imageUrl) {
          updateData.image_url = imageUrl;
        }

        // Merge new files with existing ones (if editing)
        let allFiles = [...(editingAviso.files || [])];
        if (uploadedFiles.length > 0) {
          allFiles = [...allFiles, ...uploadedFiles];
        }
        if (allFiles.length > 0) {
          updateData.files = allFiles;
        }

        const { error } = await supabase
          .from("avisos")
          .update(updateData)
          .eq("id", editingAviso.id);

        if (error) throw error;
        toast.success("Aviso atualizado com sucesso!");
      } else {
        // Create new aviso
        const insertData: any = {
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          files: uploadedFiles,
        };

        console.log(
          "💾 Salvando aviso no banco com",
          uploadedFiles.length,
          "arquivos"
        );

        const { error } = await supabase.from("avisos").insert(insertData);

        if (error) {
          console.error("❌ Erro ao inserir no banco:", error);
          throw error;
        }

        if (error) throw error;
        toast.success("Aviso criado com sucesso!");
      }

      // Reset form
      setFormData({ title: "", description: "", image: null, files: [] });
      setEditingAviso(null);
      loadAvisos();
    } catch (error) {
      console.error("Error saving aviso:", error);
      toast.error("Erro ao salvar aviso");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (aviso: Aviso) => {
    setEditingAviso(aviso);
    setFormData({
      title: aviso.title,
      description: aviso.description || "",
      image: null,
      files: [],
    });
  };

  const handleDelete = async (avisoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

    try {
      const { error } = await supabase
        .from("avisos")
        .delete()
        .eq("id", avisoId);

      if (error) throw error;

      setAvisos(avisos.filter((aviso) => aviso.id !== avisoId));
      toast.success("Aviso excluído com sucesso");
    } catch (error) {
      console.error("Error deleting aviso:", error);
      toast.error("Erro ao excluir aviso");
    }
  };

  const cancelEdit = () => {
    setEditingAviso(null);
    setFormData({ title: "", description: "", image: null, files: [] });
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-3">
              <img
                src="/logoinicio.png"
                alt="BaúAcadêmico"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full ring-1 ring-white/6 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  Painel Administrativo
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Gerenciar avisos do sistema
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

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card className="shadow-lg border-0 shadow-cosmic/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {editingAviso ? "Editar Aviso" : "Novo Aviso"}
                </CardTitle>
                <CardDescription>
                  {editingAviso
                    ? "Atualize as informações do aviso"
                    : "Crie um novo aviso para todos os usuários"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Digite o título do aviso"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Digite a descrição detalhada do aviso"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
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
                      accept="image/*"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          image: e.target.files?.[0] || null,
                        }))
                      }
                      disabled={submitting}
                      className="file:text-primary-foreground file:bg-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                    />
                  </div>

                  {/* Campo para múltiplos arquivos PDF */}
                  <div className="space-y-2">
                    <Label htmlFor="files">
                      Arquivos para Download (opcional)
                    </Label>
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        console.log(
                          "📁 Arquivos arrastados:",
                          droppedFiles.length
                        );

                        // Filtrar apenas arquivos aceitos
                        const acceptedFiles = droppedFiles.filter((file) => {
                          const extension = file.name
                            .toLowerCase()
                            .split(".")
                            .pop();
                          return ["pdf", "txt", "doc", "docx"].includes(
                            extension || ""
                          );
                        });

                        if (acceptedFiles.length !== droppedFiles.length) {
                          toast.error(
                            `${
                              droppedFiles.length - acceptedFiles.length
                            } arquivo(s) rejeitado(s). Apenas PDF, TXT, DOC e DOCX são aceitos.`
                          );
                        }

                        if (acceptedFiles.length > 0) {
                          // Validar tamanho
                          const invalidFiles = acceptedFiles.filter(
                            (file) => file.size > 10 * 1024 * 1024
                          );
                          if (invalidFiles.length > 0) {
                            toast.error(
                              `${invalidFiles.length} arquivo(s) muito grande(s). Máximo 10MB por arquivo.`
                            );
                            return;
                          }

                          setFormData((prev) => ({
                            ...prev,
                            files: [...prev.files, ...acceptedFiles],
                          }));
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("border-primary");
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary");
                      }}
                    >
                      <input
                        id="files"
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        multiple
                        onChange={(e) => {
                          console.log(
                            "📁 Arquivos selecionados:",
                            e.target.files?.length || 0
                          );

                          // Log detalhado de cada arquivo
                          if (e.target.files) {
                            for (let i = 0; i < e.target.files.length; i++) {
                              const file = e.target.files[i];
                              console.log(`📄 Arquivo ${i + 1}:`, {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                              });
                            }
                          }

                          const files = Array.from(e.target.files || []);

                          // Validar tamanho de cada arquivo
                          const invalidFiles = files.filter(
                            (file) => file.size > 10 * 1024 * 1024
                          );
                          if (invalidFiles.length > 0) {
                            toast.error(
                              `${invalidFiles.length} arquivo(s) muito grande(s). Máximo 10MB por arquivo.`
                            );
                            e.target.value = "";
                            return;
                          }

                          setFormData((prev) => ({
                            ...prev,
                            files: files,
                          }));
                        }}
                        disabled={submitting}
                        className="w-full cursor-pointer"
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="files"
                        className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileText className="w-8 h-8" />
                        <div>
                          <p className="font-medium">
                            Clique para selecionar arquivos
                          </p>
                          <p className="text-xs">ou arraste e solte aqui</p>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PDF, TXT, DOC, DOCX (máx. 10MB por
                      arquivo).
                      <strong>
                        {" "}
                        Segure Ctrl/Cmd para selecionar múltiplos arquivos.
                      </strong>
                    </p>

                    {/* Mostrar arquivos selecionados */}
                    {formData.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Arquivos selecionados ({formData.files.length}):
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-6 px-2"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, files: [] }));
                              // Limpar input também
                              const fileInput = document.getElementById(
                                "files"
                              ) as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                          >
                            Limpar todos
                          </Button>
                        </div>
                        {formData.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-xs">
                              ({Math.round(file.size / 1024)}KB)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  files: prev.files.filter(
                                    (_, i) => i !== index
                                  ),
                                }));
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      ) : editingAviso ? (
                        "Atualizar Aviso"
                      ) : (
                        "Criar Aviso"
                      )}
                    </Button>
                    {editingAviso && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
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

          {/* Avisos List */}
          <div>
            <Card className="shadow-lg border-0 shadow-cosmic/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Avisos Cadastrados
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {avisos.length} avisos
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : avisos.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum aviso cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {avisos.map((aviso) => (
                      <div
                        key={aviso.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium line-clamp-1">
                            {aviso.title}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(aviso)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(aviso.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {aviso.image_url && (
                          <div className="mb-2">
                            <img
                              src={aviso.image_url}
                              alt={aviso.title}
                              className="w-full h-32 object-cover rounded-md"
                            />
                          </div>
                        )}

                        {/* Mostrar múltiplos arquivos (novo formato) */}
                        {aviso.files && aviso.files.length > 0 && (
                          <div className="mb-2 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Arquivos ({aviso.files.length}):
                            </p>
                            {aviso.files.map((file, index) => (
                              <div
                                key={index}
                                className="p-2 bg-muted/50 rounded-md"
                              >
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium truncate flex-1">
                                    {file.name}
                                  </span>
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="ml-auto"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </a>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {file.type} • {Math.round(file.size / 1024)}KB
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {aviso.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {aviso.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(aviso.created_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
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

export default AdminPage;
