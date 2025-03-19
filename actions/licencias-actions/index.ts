// actions/licencias-actions.ts
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Definir la interfaz para las ausencias
export interface Ausencia {
  id: string;
  nombre_enfermero: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

// Función para obtener las ausencias
export const obtenerAusencias = async (): Promise<Ausencia[]> => {
  const { data, error } = await supabase
    .from("ausencias")
    .select("*")
    .order("fecha_inicio", { ascending: true }); // Ordenar por fecha de inicio

  if (error) throw error;
  return data;
};