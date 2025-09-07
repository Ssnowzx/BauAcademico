import React, { useState } from "react";
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
import { ArrowLeft, Upload, Camera, Image } from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "APC" as "APC" | "ACE" | "RECIBO",
    file: null as File | null,
    evento: "",
    horas: "",
    data_evento: "",
    observacao: "",
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !user) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      setUploading(true);

      // Upload image to Supabase Storage
      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Extract text using OCR
      let extractedText = "";
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(formData.file, "por");
        extractedText = text;
      } catch (ocrError) {
        console.error("OCR Error:", ocrError);
        toast.error("Erro ao extrair texto da imagem");
      }

      interface InsertUploadDocument {
        user_id: string;
        category: "APC" | "ACE" | "RECIBO";
        image_url: string;
        extracted_text: string;
        evento?: string;
        horas?: number;
        data_evento?: string;
        observacao?: string;
      }

      const insertData: InsertUploadDocument = {
        user_id: user.id,
        category: formData.category,
        image_url: publicUrl,
        extracted_text: extractedText,
      };

      // Adicionar campos extras baseado na categoria
      if (formData.category === "APC" || formData.category === "ACE") {
        if (formData.evento.trim()) insertData.evento = formData.evento.trim();
        if (formData.horas && parseInt(formData.horas) > 0) {
          insertData.horas = parseInt(formData.horas);
        }
        if (formData.data_evento) insertData.data_evento = formData.data_evento;
      } else if (formData.category === "RECIBO") {
        if (formData.observacao.trim())
          insertData.observacao = formData.observacao.trim();
      }

      const { data, error } = await supabase
        .from("documents")
        .insert(insertData);

      if (error) throw error;

      // Se for APC/ACE e possuir horas, registrar no hours_log para persistência do total
      try {
        if (
          insertData.horas &&
          (insertData.category === "APC" || insertData.category === "ACE")
        ) {
          const { error: hoursError } = await supabase
            .from("hours_log")
            .insert({
              user_id: user.id,
              category: insertData.category,
              hours: insertData.horas,
            });
          if (hoursError) {
            console.warn("Failed to insert hours_log:", hoursError);
            // não interrompe o fluxo principal, apenas notifica em console
          }
        }
      } catch (e) {
        console.warn("hours_log insertion failed:", e);
      }

      toast.success("Documento salvo com sucesso!");

      // Reset form
      setFormData({
        category: "APC",
        file: null,
        evento: "",
        horas: "",
        data_evento: "",
        observacao: "",
      });
      setPreview(null);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Erro ao fazer upload do documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Icon and title */}
            {/* Logo grande no header; texto aproximado sem reduzir a imagem */}
            <div className="flex items-center space-x-1 min-w-0 flex-1">
              <div className="flex items-center justify-center flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-24 sm:w-36 md:w-48 object-contain mr-0"
                />
              </div>
              <div className="min-w-0 -ml-3 sm:-ml-4">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground leading-tight truncate">
                  Adicionar Documento
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug truncate">
                  Upload de comprovantes e recibos
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
      {/* Conteúdo principal com largura um pouco menor para melhor leitura */}
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card className="shadow-lg shadow-cosmic/20 border-vibrant">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Upload de Documento
            </CardTitle>
            <CardDescription>
              Selecione a categoria e faça upload da imagem. O texto será
              extraído automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as "APC" | "ACE" | "RECIBO",
                    }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-card"
                  disabled={uploading}
                >
                  <option value="APC">APC</option>
                  <option value="ACE">ACE</option>
                  <option value="RECIBO">RECIBO</option>
                </select>
              </div>

              {/* Campos extras para APC e ACE */}
              {(formData.category === "APC" || formData.category === "ACE") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="evento">Evento</Label>
                    <Input
                      id="evento"
                      placeholder="Nome do evento"
                      value={formData.evento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          evento: e.target.value,
                        }))
                      }
                      disabled={uploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas</Label>
                    <Input
                      id="horas"
                      type="number"
                      placeholder="Quantidade de horas"
                      value={formData.horas}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          horas: e.target.value,
                        }))
                      }
                      disabled={uploading}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_evento">Data do Evento</Label>
                    <input
                      id="data_evento"
                      type="date"
                      value={formData.data_evento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          data_evento: e.target.value,
                        }))
                      }
                      disabled={uploading}
                      className="mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {/* Campo extra para RECIBO */}
              {formData.category === "RECIBO" && (
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações sobre o recibo"
                    value={formData.observacao}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observacao: e.target.value,
                      }))
                    }
                    disabled={uploading}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="file:text-primary-foreground file:bg-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                />
              </div>

              {preview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full h-64 object-contain mx-auto rounded-md"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
                disabled={uploading || !formData.file}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
