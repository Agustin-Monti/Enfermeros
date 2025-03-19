import { createClient } from "@/utils/supabase/server";

export async function fetchPaises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pais") // Nombre de la tabla en tu base de datos
    .select("*");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}
