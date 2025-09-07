import { supabase } from "./client";
import type { Database } from "./types";

export type ProvaRow = Database["public"]["Tables"]["provas"]["Row"];

export async function uploadProva(
  file: File,
  opts: {
    userId: string;
    materia?: string | null;
    nota?: number | null;
    tipo?: string | null;
    observacao?: string | null;
    filename?: string;
  }
): Promise<ProvaRow> {
  const fileExt = file.name.split(".").pop();
  const fileName = opts.filename ?? `${Date.now()}.${fileExt}`;

  let imageUrl: string | null = fileName;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("provas")
      .upload(fileName, file, { upsert: true });

    if (uploadError || !uploadData) {
      // Fallback to base64 when storage/upload fails (RLS or permissions)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      imageUrl = base64;
    } else {
      const { data: publicData } = supabase.storage
        .from("provas")
        .getPublicUrl(fileName);
      imageUrl = publicData.publicUrl ?? fileName;
    }
  } catch (e) {
    // Last resort: base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    imageUrl = base64;
  }

  const insert = {
    user_id: opts.userId,
    materia: opts.materia ?? null,
    nota: typeof opts.nota === "number" ? opts.nota : null,
    tipo: opts.tipo ?? null,
    image_url: String(imageUrl ?? ""),
    observacao: opts.observacao ?? null,
  } as Partial<ProvaRow>;

  const { data: dbData, error: dbError } = await supabase
    .from("provas")
    .insert(insert)
    // Request explicit columns to avoid PostgREST schema-cache errors when the server schema
    // is not yet updated for recently added columns (e.g. 'observacao').
    .select("id,user_id,materia,nota,tipo,image_url,created_at");

  if (dbError) {
    throw dbError;
  }

  const inserted =
    Array.isArray(dbData) && dbData.length > 0 ? (dbData[0] as ProvaRow) : null;
  if (!inserted) throw new Error("Failed to insert prova");

  return inserted as ProvaRow;
}
