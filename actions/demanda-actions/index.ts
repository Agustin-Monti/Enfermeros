"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { Demanda } from "@/components/ModalDemandaUsuario";





export const createDemandAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
    return encodedRedirect("error", "/update-profile", userError.message);
  }

  const empresa = formData.get("empresa")?.toString();
  const responsable_solicitud = formData.get("responsable_solicitud")?.toString();
  const email_contacto = formData.get("email_contacto")?.toString();
  const telefono = formData.get("telefono");
  const fecha_inicio = formData.get("fecha_inicio")?.toString();
  const fecha_vencimiento = formData.get("fecha_vencimiento")?.toString();
  const id_categoria = formData.get("id_categoria")?.toString();
  const detalle = formData.get("detalle")?.toString();
  const pais_id = formData.get("pais_id")?.toString();
  const rubro = formData.get("rubro")?.toString(); // Capturamos el rubro
  const user_id = user?.id;

  let rubro_id;

  // Verificar si el rubro es un ID (si es un número, es un rubro existente)
  if (isNaN(Number(rubro))) {
    // Si no es un número, es un rubro nuevo (texto)
    const { data: newRubro, error: newRubroError } = await supabase
      .from("rubros")
      .insert({ nombre: rubro, categoria_id: id_categoria })
      .select("id")
      .single();

    if (newRubroError) {
      console.error("Error creating rubro:", newRubroError);
      return encodedRedirect("error", "/demandas/new", newRubroError.message);
    }

    rubro_id = newRubro.id; // Asignamos el ID del nuevo rubro
  } else {
    // Si es un número, buscamos el rubro existente
    const { data: existingRubro, error: rubroError } = await supabase
      .from("rubros")
      .select("id")
      .eq("id", rubro)
      .single();

    if (rubroError) {
      console.error("Error fetching rubro:", rubroError);
      return encodedRedirect("error", "/demandas/new", rubroError.message);
    }

    rubro_id = existingRubro.id; // Usamos el ID del rubro existente
  }

  // Registrar la demanda con el rubro_id
  const { data, error: demandaError } = await supabase.from("demandas").insert({
    empresa,
    responsable_solicitud,
    email_contacto,
    telefono,
    fecha_inicio,
    fecha_vencimiento,
    id_categoria,
    pais_id,
    detalle,
    profile_id: user_id,
    rubro_id, // Guardamos el rubro_id aquí
  });

  if (demandaError) {
    console.error(demandaError.code + " " + demandaError.message);
    return encodedRedirect("error", "/demandas/new", demandaError.message);
  } else {
    return encodedRedirect(
      "success",
      "/demandas/new",
      `Demanda creada correctamente.`
    );
  }
};





export const getUserDemandas = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  if (user) {
    const { data: demandsData, error: demandsError } = await supabase
      .from("demandas")
      .select("*")
      .eq("profile_id", user.id);

    if (demandsError) {
      throw new Error("Error al obtener las demandas: " + demandsError.message);
    }

    console.log('demandas por usuario', demandsData);

    return demandsData || [];
  }

  return [];
};

export async function getAllDemandas(idCategoria = null) {
  const supabase = await createClient();

  let query = supabase
    .from("demandas")
    .select(
      "id, empresa, responsable_solicitud, email_contacto, telefono, fecha_inicio, fecha_vencimiento, detalle, pais (nombre, bandera_url), categorias (id, categoria), rubros (id, nombre)"
    );

  // Filtrar por categoría si se proporciona un `idCategoria`
  if (idCategoria) {
    query = query.eq("id_categoria", idCategoria);
  }

  const { data: demandas, error } = await query;

  if (error) {
    console.error("Error fetching demandas:", error);
    return [];
  }



  return demandas;
}


export async function getAllDemandasLimit() {
  const supabase = await createClient();

  const { data: demandas, error } = await supabase
    .from("demandas")
    .select("id, empresa, responsable_solicitud, email_contacto, telefono, fecha_inicio, fecha_vencimiento, detalle, pais (nombre, bandera_url), categorias (id, categoria), rubros (id, nombre)")
    .order("fecha_inicio", { ascending: false })
    .limit(9);

  if (error) {
    console.error("Error fetching demandas:", error);
    return [];
  }

  return demandas;
}

export async function getDemandaById(id: string) { 
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demandas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching demanda:", error);
    return null;
  }

  return data;
}



export async function fetchDemandasPorCategoria(idCategoria: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demandas")
    .select("*")
    .eq("id_categoria", idCategoria);

  if (error) throw new Error(error.message);
  return data;
}


export const fetchDemandas = async (userId: string) => {
  const supabase = await createClient();

  // Obtener el usuario
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Si no hay un usuario autenticado, redirigir al login
  if (!user) {
    return redirect("/sign-in");
  }

  // Si el usuario está autenticado, podemos proceder a obtener las demandas
  try {
    const { data, error } = await supabase
      .from("demandas")
      .select("*")
      .eq("profile_id", userId); // Utiliza el userId recibido en vez de user.id

    if (error) {
      console.error("Error al obtener demandas:", error.message);
      return [];
    }

    return data || [];  // Devuelve las demandas obtenidas, o un array vacío si no hay datos

  } catch (error) {
    console.error("Error al obtener demandas:");
    return [];
  }
};




export const updateDemanda = async (demanda: Demanda) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("demandas")
      .update({ detalle: demanda.detalle, rubro_demanda: demanda.rubro_demanda, empresa:demanda.empresa, telefono:demanda.telefono, fecha_inicio:demanda.fecha_inicio, fecha_vencimiento:demanda.fecha_vencimiento })
      .eq("id", demanda.id);

    if (error) {
      console.error("Error al actualizar demanda:", error.message);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error("Error en updateDemanda:", err);
    throw err;
  }
};




// Delete function



export async function deleteDemanda(id: string) {
  const supabase = await createClient();
  console.log("Intentando borrar demanda con ID:", id);

  const { error } = await supabase
    .from("demandas")
    .delete()
    .eq("id", id); // Filtra por el id de la demanda

  if (error) {
    console.error("Error al borrar la demanda:", error);
    throw new Error("Error al borrar la demanda: " + error.message);
  }

  console.log("Demanda borrada correctamente:", id);
  return { success: true, message: "Demanda borrada correctamente." };
}

export async function getDemandasByCategoria(idCategoria: string) {
  const supabase = await createClient();
  const { data: demandas, error } = await supabase
    .from("demandas")
    .select("*")
    .eq("id_categoria", idCategoria); // Filtrar por categoría

  if (error) {
    console.error("Error fetching demandas by category:", error);
    return [];
  }

  return demandas;
}


export async function getCategorias() {
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


export async function getPaises() {
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




export async function getRubros() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rubros") // Nombre de la tabla en tu base de datos
    .select("*");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}

