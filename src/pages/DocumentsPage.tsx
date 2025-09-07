import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";

interface Document {
  id: string;
  category: string;
  image_url: string;
  extracted_text: string;
  evento?: string;
  horas?: number;
  data_evento?: string;
  created_at: string;
}

// Tipo usado para inserção no banco (forma esperada pelo Supabase)
interface InsertDocument {
  user_id: string;
  category: string;
  image_url: string;
  extracted_text: string;
  evento?: string;
  horas?: number;
  data_evento?: string;
  observacao?: string;
}

const DocumentsPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Upload UI state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Form fields for APC/ACE
  const [evento, setEvento] = useState("");
  const [horas, setHoras] = useState<number | "">("");
  const [dataEvento, setDataEvento] = useState("");

  const categoryConfig = {
    apc: {
      title: "APC",
      description: "Atividades Práticas Curriculares",
      color: "bg-chart-1",
    },
    ace: {
      title: "ACE",
      description: "Atividades Complementares de Ensino",
      color: "bg-chart-2",
    },
    recibos: {
      title: "RECIBOS",
      description: "Comprovantes de Mensalidade",
      color: "bg-chart-3",
    },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig];

  // helper to determine if current user is a non-admin (consider DEV persisted user)
  const isNonAdminUser = (() => {
    if (user) return !user.is_admin;
    if (import.meta.env.DEV) {
      try {
        const raw = localStorage.getItem("dev_user");
        if (raw) {
          const du = JSON.parse(raw);
          return !du?.is_admin;
        }
      } catch (e) {
        /* ignore */
      }
    }
    return false;
  })();

  useEffect(() => {
    if (user && category) {
      loadDocuments();
    }
  }, [user, category, loadDocuments]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);

      // DEV fallback: load documents from localStorage when using a dev user id
      if (import.meta.env.DEV && user?.id?.startsWith("dev")) {
        console.log("DEV mode: loading documents from localStorage");
        const devDocs = JSON.parse(
          localStorage.getItem("dev_documents") || "[]"
        ) as Array<Record<string, unknown>>;
        const categoryKey =
          category?.toLowerCase() === "recibo"
            ? "recibos"
            : category?.toLowerCase();
        const filtered = devDocs
          .filter(
            (d) =>
              String(d.category || "").toLowerCase() ===
              (categoryKey || "").toLowerCase()
          )
          .map((d) => ({
            id: String(d.id),
            category: String(d.category),
            image_url: String(d.dataUrl || d.image_url),
            extracted_text: String(d.extracted_text || ""),
            evento: d.evento ? String(d.evento) : undefined,
            horas: d.horas ? Number(d.horas) : undefined,
            data_evento: d.data_evento ? String(d.data_evento) : undefined,
            created_at: String(d.created_at || new Date().toISOString()),
          })) as Document[];
        setDocuments(filtered.reverse());
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .eq("category", category?.toUpperCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }, [user?.id, category]);

  const deleteDocument = async (docId: string) => {
    try {
      // DEV fallback: remove from localStorage
      if (import.meta.env.DEV && user?.id?.startsWith("dev")) {
        const devDocs = JSON.parse(
          localStorage.getItem("dev_documents") || "[]"
        ) as Array<Record<string, unknown>>;
        const remaining = devDocs.filter((d) => String(d.id) !== docId);
        localStorage.setItem("dev_documents", JSON.stringify(remaining));
        setDocuments(documents.filter((doc) => doc.id !== docId));
        toast.success("Documento excluído (modo desenvolvimento)");
        return;
      }

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setDocuments(documents.filter((doc) => doc.id !== docId));
      toast.success("Documento excluído com sucesso");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erro ao excluir documento");
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${
      supabase.storage.from("documents").getPublicUrl(url).data.publicUrl
    }`;
  };

  // Upload helpers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }
    if (!user) {
      toast.error("Faça login para salvar documentos");
      return;
    }

    try {
      setUploading(true);

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // DEV fallback
      if (import.meta.env.DEV && user.id?.startsWith("dev")) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const devDocs = JSON.parse(
          localStorage.getItem("dev_documents") || "[]"
        ) as Array<Record<string, unknown>>;
        const categoryKey =
          category?.toLowerCase() === "recibo"
            ? "recibos"
            : category?.toLowerCase();
        const doc = {
          id: fileName,
          fileName,
          dataUrl,
          category: categoryKey,
          extracted_text: "",
          evento: evento || undefined,
          horas: horas ? Number(horas) : undefined,
          data_evento: dataEvento || undefined,
          created_at: new Date().toISOString(),
        };
        devDocs.push(doc);
        localStorage.setItem("dev_documents", JSON.stringify(devDocs));

        setDocuments([
          {
            id: doc.id,
            category: doc.category,
            image_url: doc.dataUrl,
            extracted_text: doc.extracted_text,
            evento: doc.evento,
            horas: doc.horas,
            data_evento: doc.data_evento,
            created_at: doc.created_at,
          },
          ...documents,
        ]);
        toast.success("Documento salvo (modo desenvolvimento)");
        setUploadOpen(false);
        setSelectedFile(null);
        setPreview("");
        return;
      }

      // Fallback: usar base64 se storage falhar por RLS
      let imageUrl = fileName;

      try {
        // Tentar upload normal primeiro
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) {
          console.warn(
            "Storage upload failed, using base64 fallback:",
            uploadError
          );
          // Converter para base64 como fallback
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          imageUrl = base64;
        } else {
          // Se upload funcionou, usar URL pública
          const { data: publicUrl } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName);
          imageUrl = publicUrl.publicUrl;
        }
      } catch (error) {
        console.warn("Storage completely failed, using base64:", error);
        // Usar base64 como último recurso
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        imageUrl = base64;
      }

      // Insert DB record
      const insertData: InsertDocument = {
        user_id: user.id,
        category: String(category?.toUpperCase() || ""),
        image_url: String(imageUrl || ""), // Usar a URL correta (storage ou base64)
        extracted_text: "",
      };

      // Adicionar campos extras para APC e ACE
      if (category === "apc" || category === "ace") {
        if (evento) insertData.evento = evento;
        if (horas) insertData.horas = Number(horas);
        if (dataEvento) insertData.data_evento = dataEvento;
      }

      const { data: dbData, error: dbError } = await supabase
        .from("documents")
        .insert(insertData);

      if (dbError) {
        console.error("DB insert error:", dbError);
        throw dbError;
      }

      const dbArray = Array.isArray(dbData) ? (dbData as Document[]) : [];
      const inserted = dbArray.length > 0 ? dbArray[0] : null;

      const newDoc = {
        id: inserted?.id ?? fileName,
        category: category ?? "",
        image_url: fileName,
        extracted_text: "",
        evento: evento || undefined,
        horas: horas ? Number(horas) : undefined,
        data_evento: dataEvento || undefined,
        created_at: inserted?.created_at ?? new Date().toISOString(),
      };

      setDocuments([newDoc, ...documents]);
      toast.success("Documento salvo com sucesso");
      setUploadOpen(false);
      setSelectedFile(null);
      setPreview("");
      // Limpar campos do formulário
      setEvento("");
      setHoras("");
      setDataEvento("");
    } catch (error) {
      console.error("Upload error:", error);
      const err = error as
        | { message?: string; statusText?: string }
        | undefined;
      const msg = String(err?.message || err?.statusText || error);
      if (msg.toLowerCase().includes("row-level")) {
        toast.error(
          "Erro de permissão (RLS). Verifique políticas do Supabase para a tabela 'documents'."
        );
      } else if (
        msg.toLowerCase().includes("bad request") ||
        msg.includes("400")
      ) {
        toast.error(
          "Erro no upload (400). Verifique bucket 'documents' e se o arquivo é suportado."
        );
      } else {
        toast.error("Erro ao salvar documento");
      }
    } finally {
      setUploading(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
          <Button onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold truncate">
                  {config.title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Badge
                variant="secondary"
                className="px-2 py-1 text-xs sm:text-sm whitespace-nowrap"
              >
                {documents.length} docs
              </Badge>
              {isNonAdminUser && documents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadOpen(true)}
                  className={`text-xs sm:text-sm px-2 sm:px-3 transition-all duration-200 ${
                    category === "apc"
                      ? "border-chart-1-30 text-chart-1 hover:bg-chart-1-10 hover:border-chart-1-50"
                      : category === "ace"
                      ? "border-chart-2-30 text-chart-2 hover:bg-chart-2-10 hover:border-chart-2-50"
                      : "border-chart-3-30 text-chart-3 hover:bg-chart-3-10 hover:border-chart-3-50"
                  }`}
                >
                  <span className="hidden sm:inline">Adicionar Documento</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum documento encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não tem documentos da categoria {config.title}
            </p>
            <Button
              onClick={() => setUploadOpen(true)}
              variant="outline"
              className={`transition-all duration-200 ${
                category === "apc"
                  ? "border-chart-1-30 text-chart-1 hover:bg-chart-1-10 hover:border-chart-1-50"
                  : category === "ace"
                  ? "border-chart-2-30 text-chart-2 hover:bg-chart-2-10 hover:border-chart-2-50"
                  : "border-chart-3-30 text-chart-3 hover:bg-chart-3-10 hover:border-chart-3-50"
              }`}
            >
              Adicionar Primeiro Documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="group hover:shadow-cosmic transition-shadow duration-300 border-vibrant"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {config.title} - {formatDate(doc.created_at)}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(doc.created_at, "dd 'de' MMMM 'às' HH:mm")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Preview */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(doc.image_url)}
                      alt="Document"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setSelectedDoc(doc)}
                    />
                  </div>

                  {/* Extra Fields Preview */}
                  {(doc.evento || doc.horas) && (
                    <div className="bg-muted/50 p-3 rounded-md space-y-2">
                      {doc.evento && (
                        <div>
                          <span className="text-xs font-medium">Evento:</span>
                          <p className="text-xs text-muted-foreground">
                            {doc.evento}
                          </p>
                        </div>
                      )}
                      {doc.horas && (
                        <div>
                          <span className="text-xs font-medium">Horas:</span>
                          <p className="text-xs text-muted-foreground">
                            {doc.horas}h
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Text Preview */}
                  {doc.extracted_text && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <h4 className="text-xs font-medium mb-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Texto Extraído
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {doc.extracted_text}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Adicionar Documento - {config.title}
              </h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setUploadOpen(false);
                  setSelectedFile(null);
                  setPreview("");
                  setEvento("");
                  setHoras("");
                  setDataEvento("");
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Imagem do Documento
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
                {preview && (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Campos adicionais para APC e ACE */}
              {(category === "apc" || category === "ace") && (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      Nome do Evento
                    </label>
                    <input
                      type="text"
                      value={evento}
                      onChange={(e) => setEvento(e.target.value)}
                      placeholder="Ex: Workshop de React"
                      className="mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Quantidade de Horas
                    </label>
                    <input
                      type="number"
                      value={horas}
                      onChange={(e) =>
                        setHoras(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Ex: 8"
                      className="mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Data do Evento
                    </label>
                    <input
                      type="date"
                      value={dataEvento}
                      onChange={(e) => setDataEvento(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={uploadDocument}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Documento
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUploadOpen(false);
                    setSelectedFile(null);
                    setPreview("");
                    setEvento("");
                    setHoras("");
                    setDataEvento("");
                  }}
                >
                  Cancelar
                </Button>
              </div>

              {!user && (
                <p className="text-sm text-destructive">
                  Faça login para salvar documentos.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {config.title} - {formatDate(selectedDoc.created_at)}
                </h2>
                <Button variant="ghost" onClick={() => setSelectedDoc(null)}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <img
                src={getImageUrl(selectedDoc.image_url)}
                alt="Document"
                className="w-full rounded-lg shadow-lg"
              />

              {/* Extra Fields */}
              {(selectedDoc.evento || selectedDoc.horas) && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Informações Adicionais:
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    {selectedDoc.evento && (
                      <div>
                        <span className="font-medium">Evento:</span>
                        <p className="text-muted-foreground">
                          {selectedDoc.evento}
                        </p>
                      </div>
                    )}
                    {selectedDoc.horas && (
                      <div>
                        <span className="font-medium">Horas:</span>
                        <p className="text-muted-foreground">
                          {selectedDoc.horas} horas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDoc.extracted_text && (
                <div>
                  <h3 className="font-semibold mb-3">Texto Extraído:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedDoc.extracted_text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
