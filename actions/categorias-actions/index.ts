import { createClient } from "@/utils/supabase/server";

export async function getDemandasByCategoria(categoriaId: string) { const supabase = await createClient(); // Await the promise here to get the Supabase client 
const { data, error } = await supabase .from("demandas") .select("*") .eq("categoria", categoriaId); if (error) { console.error("Error fetching demandas:", error); return []; } return data; }

export async function fetchCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias") // Nombre de la tabla en tu base de datos
    .select("*");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}

export async function getCategorias() {
  const supabase = await createClient();
  const { data: categorias, error } = await supabase
    .from("categorias")
    .select("id, categoria");

  if (error) {
    console.error("Error fetching categorias:", error);
    return [];
  }

  return categorias;
}

