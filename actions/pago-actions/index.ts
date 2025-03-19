// actions/pago-action/index.ts

"use server";  // Asegúrate de que esta función se ejecute en el servidor

import { createClient } from "@/utils/supabase/server";  // Importa la función createClient desde el archivo server.ts

export async function getPagoByDemandaAndCorreo(demandaId: string, correoPagador: string) {
  const supabase = await createClient();  // Crea el cliente de Supabase con la configuración del servidor

  try {
    // Realiza la consulta a la tabla 'pagos' con el ID de la demanda y el correo del pagador
    const { data, error } = await supabase
      .from("pagos")
      .select("*")
      .eq("demanda_id", demandaId)  // Filtra por 'demanda_id'
      .eq("correo_pagador", correoPagador)  // Filtra por 'correo_pagador'
      .single();  // Solo esperamos un resultado único

    if (error) {
      console.error("Error fetching pago:", error);  // Si hay un error, lo mostramos
      return null;
    }

    return data;  // Retorna los datos si no hay error
  } catch (error) {
    console.error("Error in getPagoByDemandaAndCorreo:", error);  // Si ocurre un error inesperado
    return null;
  }
}
