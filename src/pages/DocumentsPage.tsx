/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { uploadProva } from "@/integrations/supabase/provas";
import { useAuth } from "@/contexts/useAuth";
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  Trash2,
  Check,
  Award,
  GraduationCap,
  Receipt,
  Plus,
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

interface Prova {
  id: string;
  user_id?: string | null;
  materia?: string | null;
  nota?: number | null;
  tipo?: string | null;
  image_url?: string | null;
  observacao?: string | null;
  created_at?: string | null;
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
  materia?: string; // suportado para provas
  nota?: number; // suportado para provas
}

const DocumentsPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | Prova | null>(null);
  const [persistedTotalHours, setPersistedTotalHours] = useState<number | null>(
    null
  );

  // Upload UI state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Form fields for APC/ACE
  const [evento, setEvento] = useState("");
  const [horas, setHoras] = useState<number | "">("");
  const [dataEvento, setDataEvento] = useState("");
  // Form fields for PROVAS
  const [materia, setMateria] = useState("");
  const [nota, setNota] = useState<number | "">("");

  const categoryConfig = {
    apc: {
      title: "APC",
      description: "Atividades Práticas Curriculares",
      color: "bg-chart-1",
      gradient: "bg-gradient-chart-1",
      icon: Award,
    },
    ace: {
      title: "ACE",
      description: "Atividades Complementares de Ensino",
      color: "bg-chart-2",
      gradient: "bg-gradient-chart-2",
      icon: GraduationCap,
    },
    recibos: {
      title: "RECIBOS",
      description: "Comprovantes de Mensalidade",
      color: "bg-chart-3",
      gradient: "bg-gradient-chart-3",
      icon: Receipt,
    },
    provas: {
      title: "PROVAS / TRABALHOS",
      description: "Provas e trabalhos — notas por matéria",
      color: "bg-chart-4",
      gradient: "bg-gradient-chart-4",
      icon: FileText,
    },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig];

  // Normalize category param for consistent comparisons (handles 'APC', 'apc', etc.)
  const categoryNormalized = (category || "").toLowerCase();

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

  // Use a function declaration (hoisted) to avoid 'used before declaration' errors
  async function loadDocuments() {
    try {
      setLoading(true);

      // DEV fallback: load documents from localStorage when using a dev user id
      if (import.meta.env.DEV && user?.id?.startsWith("dev")) {
        console.log("DEV mode: loading documents from localStorage");

        const categoryKey =
          category?.toLowerCase() === "recibo"
            ? "recibos"
            : category?.toLowerCase();

        const devDocs = JSON.parse(
          localStorage.getItem("dev_documents") || "[]"
        ) as Array<Record<string, unknown>>;

        if (categoryKey === "provas") {
          const filtered = devDocs
            .filter((d) => String(d.category || "").toLowerCase() === "provas")
            .map((d) => ({
              id: String(d.id),
              user_id: d.user_id ? String(d.user_id) : undefined,
              materia: d.materia ? String(d.materia) : undefined,
              nota: d.nota ? Number(d.nota) : undefined,
              tipo: d.tipo ? String(d.tipo) : undefined,
              image_url: String(d.dataUrl || d.image_url),
              observacao: d.observacao ? String(d.observacao) : undefined,
              created_at: String(d.created_at || new Date().toISOString()),
            })) as Prova[];
          setProvas(filtered.reverse());
          return;
        }

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

      // Garantir que o usuário existe na tabela users antes de buscar dados
      if (user?.id && !user.id.startsWith("dev")) {
        // User existence will be handled by RLS policies
        console.log("Loading data for user:", user.id);
      }

      // If category is 'provas', read from the dedicated table
      if ((category || "").toLowerCase() === "provas") {
        const { data, error } = await supabase
          .from("provas")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProvas((data as Prova[]) || []);
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
      // Buscar total persistido em hours_log para esta categoria
      try {
        const categoryUpper = (category || "").toUpperCase();
        // Evitar uso de agregação via PostgREST (schema cache PGRST200/PGRST204).
        // Ler as linhas e somar no cliente — mais resiliente ao cache do Supabase.
        const { data: hoursRows, error: hoursError } = await supabase
          .from("hours_log")
          .select("hours")
          .eq("user_id", user?.id)
          .eq("category", categoryUpper);

        if (hoursError) {
          console.warn("Failed to load persisted hours (rows):", hoursError);
          setPersistedTotalHours(null);
        } else if (Array.isArray(hoursRows)) {
          const total = hoursRows.reduce(
            (acc, r) => acc + (Number((r as any).hours) || 0),
            0
          );
          setPersistedTotalHours(total);
        } else {
          setPersistedTotalHours(0);
        }
      } catch (e) {
        console.warn("Error fetching hours_log (agg):", e);
        setPersistedTotalHours(null);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && category) {
      void loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category]);

  // Total de horas (somente leitura, memoizado para otimização)
  const totalHours = useMemo(() => {
    return documents.reduce((acc, d) => acc + (Number(d.horas ?? 0) || 0), 0);
  }, [documents]);

  // Combined total: sempre mostrar o maior valor entre persistido e calculado para APC/ACE
  const combinedTotalHours = useMemo(() => {
    if (categoryNormalized === "apc" || categoryNormalized === "ace") {
      // Para APC/ACE, usar o maior valor entre persistido e calculado
      const calculated = totalHours || 0;
      const persisted = persistedTotalHours || 0;
      return Math.max(calculated, persisted);
    }
    // Para outras categorias, sempre usar total calculado
    return totalHours;
  }, [categoryNormalized, persistedTotalHours, totalHours]);

  // Médias por matéria (apenas para provas)
  const provasAverages = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    provas.forEach((p) => {
      const key = (p.materia || "Sem matéria").trim();
      if (p.nota != null) {
        const n = Number(p.nota) || 0;
        const existing = map.get(key) ?? { sum: 0, count: 0 };
        existing.sum += n;
        existing.count += 1;
        map.set(key, existing);
      }
    });
    return Array.from(map.entries()).map(([materia, { sum, count }]) => ({
      materia,
      avg: count > 0 ? sum / count : null,
      count,
    }));
  }, [provas]);

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

  const getImageUrl = (url: string | undefined, isProva = false) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;

    // Usar bucket específico baseado no tipo
    const bucketName = isProva ? "provas" : "documents";
    return `${
      supabase.storage.from(bucketName).getPublicUrl(url).data.publicUrl
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

      // Garantir que o usuário existe na tabela users antes de inserir
      if (!user.id?.startsWith("dev")) {
        console.log("Uploading document for user:", user.id);
      }

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
        if ((categoryKey || "") === "provas") {
          const prova = {
            id: fileName,
            fileName,
            dataUrl,
            category: categoryKey,
            materia: materia || undefined,
            nota: nota ? Number(nota) : undefined,
            observacao: undefined,
            created_at: new Date().toISOString(),
          };
          devDocs.push(prova);
          localStorage.setItem("dev_documents", JSON.stringify(devDocs));

          setProvas([
            {
              id: prova.id,
              user_id: user.id,
              materia: prova.materia,
              nota: prova.nota,
              image_url: prova.dataUrl,
              observacao: prova.observacao,
              created_at: prova.created_at,
            },
            ...provas,
          ]);
        } else {
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
        }
        toast.success("Documento salvo (modo desenvolvimento)");
        setUploadOpen(false);
        setSelectedFile(null);
        setPreview("");
        setMateria("");
        setNota("");
        return;
      }

      // Fallback: usar base64 se storage falhar por RLS
      let imageUrl = fileName;

      // Determinar bucket baseado na categoria
      const bucketName =
        (category || "").toLowerCase() === "provas" ? "provas" : "documents";

      try {
        // Tentar upload normal primeiro
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) {
          console.warn(
            `Storage upload failed for bucket ${bucketName}, using base64 fallback:`,
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
            .from(bucketName)
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
      // variável auxiliar que será preenchida tanto para 'provas' quanto para 'documents'
      let newDoc: any = null;
      if ((category || "").toLowerCase() === "provas") {
        // Use centralized upload function which handles storage + DB insert
        const inserted = await uploadProva(selectedFile as File, {
          userId: user.id,
          materia: materia || null,
          nota: nota !== "" ? Number(nota) : null,
          tipo: null,
          observacao: null,
          filename: fileName,
        });

        const newProva: Prova = {
          id: inserted.id,
          user_id: inserted.user_id ?? user.id,
          materia: inserted.materia ?? (materia || undefined),
          nota: inserted.nota ?? (nota !== "" ? Number(nota) : undefined),
          image_url: inserted.image_url ?? String(imageUrl || ""),
          observacao: inserted.observacao ?? undefined,
          created_at: inserted.created_at ?? new Date().toISOString(),
        };

        newDoc = newProva;
        setProvas([newProva, ...provas]);
        toast.success("Prova salva com sucesso");
        setUploadOpen(false);
        setSelectedFile(null);
        setPreview("");
        setMateria("");
        setNota("");
      } else {
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
          .insert(insertData)
          .select();

        if (dbError) {
          console.error("DB insert error:", dbError);
          throw dbError;
        }

        const dbArray = Array.isArray(dbData) ? (dbData as Document[]) : [];
        const inserted = dbArray.length > 0 ? dbArray[0] : null;

        newDoc = {
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
      }

      // Persistir horas em hours_log (APC / ACE) e atualizar estado local imediatamente
      try {
        const isApcAce =
          categoryNormalized === "apc" || categoryNormalized === "ace";
        if (isApcAce && user) {
          const insertedHours = newDoc?.horas ? Number(newDoc.horas) : 0;
          if (insertedHours > 0) {
            const { error: hoursError } = await supabase
              .from("hours_log")
              .insert({
                user_id: user.id,
                category: (category || "").toUpperCase(),
                hours: insertedHours,
              });
            if (hoursError) {
              console.warn("Failed to insert hours_log:", hoursError);
            } else {
              // Atualiza o total persistido em tela para refletir imediatamente
              setPersistedTotalHours(
                (prev) => Number(prev ?? 0) + insertedHours
              );
            }
          }
        }
      } catch (e) {
        console.warn("hours_log insertion failed:", e);
      }
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

  // if (!config) {
  //   return (
  //     <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
  //         <Button onClick={() => navigate("/dashboard")}>
  //           Voltar ao Dashboard
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

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
              {React.createElement(config.icon, {
                className: "w-6 h-6 text-primary",
              })}
              <div>
                <h1 className="text-lg font-bold">{config.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (category || "").toLowerCase() === "provas" ? (
          provas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma prova encontrada
              </h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não tem provas cadastradas
              </p>
              <Button onClick={() => setUploadOpen(true)} variant="outline">
                Adicionar Primeira Prova
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provas.map((p) => (
                  <Card
                    key={p.id}
                    className="group hover:shadow-cosmic transition-shadow duration-300"
                    style={{
                      borderTop: "1px solid oklch(0.627 0.265 303.9)",
                      borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                      borderRight: "4px solid oklch(0.627 0.265 303.9)",
                      borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                      borderRadius: "0.75rem",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {p.materia || "Sem matéria"} -{" "}
                          {p.nota != null ? p.nota : "-"}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Optionally implement deletion for provas later
                            try {
                              const { error } = await supabase
                                .from("provas")
                                .delete()
                                .eq("id", p.id)
                                .eq("user_id", user?.id);
                              if (error) throw error;
                              setProvas((prev) =>
                                prev.filter((x) => x.id !== p.id)
                              );
                              toast.success("Prova excluída");
                            } catch (e) {
                              console.error("Error deleting prova", e);
                              toast.error("Erro ao excluir prova");
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription className="flex items-center text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(
                          p.created_at || new Date().toISOString(),
                          "dd 'de' MMMM 'às' HH:mm"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(p.image_url || "", true)}
                          alt="Prova"
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={() => setSelectedDoc(p)}
                        />
                      </div>

                      {p.observacao && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <div className="text-xs font-medium">Observação</div>
                          <p className="text-xs text-muted-foreground">
                            {p.observacao}
                          </p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedDoc(p)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )
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
                className="group hover:shadow-cosmic transition-shadow duration-300"
                style={{
                  borderTop: "1px solid oklch(0.627 0.265 303.9)",
                  borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                  borderRight: "4px solid oklch(0.627 0.265 303.9)",
                  borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                }}
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

      {/* Total de Horas (APC / ACE) */}
      {(categoryNormalized === "apc" || categoryNormalized === "ace") && (
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto mt-6">
            <div
              className="bg-card border rounded-lg p-4 flex items-center justify-between shadow-sm"
              style={{
                borderTop: "1px solid oklch(0.627 0.265 303.9)",
                borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                borderRight: "4px solid oklch(0.627 0.265 303.9)",
                borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                borderRadius: "0.75rem",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div>
                <h4 className="text-sm font-medium">Total de Horas</h4>
                <p className="text-xs text-muted-foreground">
                  Soma das horas de todos os documentos nesta categoria
                </p>
              </div>
              <div className="text-2xl font-bold">{combinedTotalHours}h</div>
            </div>
          </div>
        </div>
      )}

      {/* Médias por Matéria (PROVAS) */}
      {(category || "").toLowerCase() === "provas" &&
        provasAverages.length > 0 && (
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-4xl mx-auto mt-6">
              <div
                className="bg-card border rounded-lg p-4 flex flex-col space-y-4 shadow-sm"
                style={{
                  borderTop: "1px solid oklch(0.627 0.265 303.9)",
                  borderLeft: "1px solid oklch(0.627 0.265 303.9)",
                  borderRight: "4px solid oklch(0.627 0.265 303.9)",
                  borderBottom: "4px solid oklch(0.627 0.265 303.9)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div>
                  <h4 className="text-sm font-medium">Médias por Matéria</h4>
                  <p className="text-xs text-muted-foreground">
                    Média das notas por matéria
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {provasAverages.map((a) => (
                    <div key={a.materia} className="bg-muted/60 p-3 rounded-md">
                      <div className="text-xs text-muted-foreground">
                        {a.materia}
                      </div>
                      <div className="font-semibold text-lg">
                        {a.avg !== null ? a.avg.toFixed(2) : "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.count} registro(s)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                  setMateria("");
                  setNota("");
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

              {/* Campos adicionais para PROVAS / TRABALHOS */}
              {(category || "").toLowerCase() === "provas" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Matéria</label>
                    <input
                      type="text"
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      placeholder="Ex: Matemática"
                      className="mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Nota</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nota}
                      onChange={(e) =>
                        setNota(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Ex: 8.50"
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
                    setMateria("");
                    setNota("");
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
                  {config.title} - {formatDate((selectedDoc as any).created_at)}
                </h2>
                <Button variant="ghost" onClick={() => setSelectedDoc(null)}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <img
                src={getImageUrl(
                  (selectedDoc as any).image_url || "",
                  category?.toLowerCase() === "provas"
                )}
                alt="Document"
                className="w-full rounded-lg shadow-lg"
              />

              {/* Extra Fields */}
              {((selectedDoc as any).evento ||
                (selectedDoc as any).horas ||
                (selectedDoc as any).nota) && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Informações Adicionais:
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    {(selectedDoc as any).evento && (
                      <div>
                        <span className="font-medium">Evento:</span>
                        <p className="text-muted-foreground">
                          {(selectedDoc as any).evento}
                        </p>
                      </div>
                    )}
                    {(selectedDoc as any).horas && (
                      <div>
                        <span className="font-medium">Horas:</span>
                        <p className="text-muted-foreground">
                          {(selectedDoc as any).horas} horas
                        </p>
                      </div>
                    )}
                    {(selectedDoc as any).nota != null && (
                      <div>
                        <span className="font-medium">Nota:</span>
                        <p className="text-muted-foreground">
                          {(selectedDoc as any).nota}
                        </p>
                      </div>
                    )}
                    {(selectedDoc as any).materia && (
                      <div>
                        <span className="font-medium">Matéria:</span>
                        <p className="text-muted-foreground">
                          {(selectedDoc as any).materia}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedDoc as any).extracted_text && (
                <div>
                  <h3 className="font-semibold mb-3">Texto Extraído:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">
                      {(selectedDoc as any).extracted_text}
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
