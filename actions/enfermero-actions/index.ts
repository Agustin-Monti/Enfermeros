import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// 📌 Obtener todos los enfermeros
export const getEnfermeros = async () => {
  const { data, error } = await supabase.from("enfermeros").select("*");
  if (error) throw error;
  return data;
};

// 📌 Insertar un nuevo enfermero
export const addEnfermero = async (enfermero: any) => {
  const { data, error } = await supabase.from("enfermeros").insert([enfermero]);
  if (error) throw error;
  return data;
};

// 📌 Editar un enfermero
export const updateEnfermero = async (id: string, updatedData: any) => {
  const { data, error } = await supabase.from("enfermeros").update(updatedData).eq("id", id);
  if (error) throw error;
  return data;
};

// 📌 Eliminar un enfermero
export const deleteEnfermero = async (id: string) => {
  const { error } = await supabase.from("enfermeros").delete().eq("id", id);
  if (error) throw error;
};

export const getEnfermerosTurnos = async () => {
    const { data, error } = await supabase.from("enfermeros").select("*");
  
    if (error) {
      console.error("Error al obtener enfermeros:", error);
      return [];
    }
  
    return data.map((enfermero) => ({
      ...enfermero,
      vacaciones: Array.isArray(enfermero.vacaciones)
        ? enfermero.vacaciones
        : JSON.parse(enfermero.vacaciones || "[]"), // Convierte string JSON a array
      franco: Array.isArray(enfermero.franco)
        ? enfermero.franco
        : JSON.parse(enfermero.franco || "[]"), // Convierte string JSON a array
    }));
};


export const getEnfermeroById = async (id: string) => {
  const { data, error } = await supabase.from("enfermeros").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};


export const guardarAusencias = async (ausencia: {
  nombre_enfermero: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}) => {
  const { data, error } = await supabase
    .from("ausencias")
    .insert([ausencia])
    .select();

  if (error) throw error;
  return data;
};


export const guardarCalendario = async (calendario: {
  mes: number;
  año: number;
  calendario: any; // El calendario en formato JSON
}) => {
  const { data, error } = await supabase
    .from("calendarios")
    .insert([calendario])
    .select();

  if (error) throw error;
  return data;
};
