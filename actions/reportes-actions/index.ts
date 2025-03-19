import { createClient } from "@/utils/supabase/client";
import * as XLSX from "xlsx";


const supabase = createClient();


// Definir la interfaz aquí
export interface Calendario {
  id: string;
  mes: number;
  año: number;
  calendario: any; // El calendario en formato JSON
  fecha_creacion: string;
}

export interface EstadisticasEnfermero {
  nombre: string;
  diasTrabajados: number;
  diasNoTrabajados: number;
}

export const obtenerCalendarios = async () => {
  const { data, error } = await supabase
    .from("calendarios")
    .select("*")
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data;
};


// Función para descargar en formato Excel
export const descargarExcel = (calendarios: Calendario[]) => {
  // Crear una hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(
    calendarios.map((calendario) => ({
      Mes: calendario.mes,
      Año: calendario.año,
      "Fecha de Creación": new Date(calendario.fecha_creacion).toLocaleDateString("es-ES"),
      Calendario: JSON.stringify(calendario.calendario), // Convertir el JSON a string
    }))
  );

  // Crear un libro de trabajo y agregar la hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calendarios");

  // Escribir el archivo y descargarlo
  XLSX.writeFile(wb, "calendarios.xlsx");
};

export const calcularEstadisticas = (calendario: any[]): EstadisticasEnfermero[] => {
  const estadisticas: { [nombre: string]: { trabajados: number; noTrabajados: number } } = {};

  // Obtener todos los enfermeros únicos
  const todosEnfermeros = new Set<string>(
    calendario.flatMap((dia) => [
      ...dia.mañana.map((e: any) => e.nombre),
      ...dia.tarde.map((e: any) => e.nombre),
      ...dia.noche.map((e: any) => e.nombre),
    ])
  );

  // Recorrer el calendario
  calendario.forEach((dia) => {
    const turnos = [...dia.mañana, ...dia.tarde, ...dia.noche]; // Combinar todos los turnos del día

    // Contar días trabajados
    turnos.forEach((enfermero: any) => {
      if (!estadisticas[enfermero.nombre]) {
        estadisticas[enfermero.nombre] = { trabajados: 0, noTrabajados: 0 };
      }
      estadisticas[enfermero.nombre].trabajados += 1;
    });

    // Contar días no trabajados
    todosEnfermeros.forEach((nombre) => {
      if (!turnos.some((e: any) => e.nombre === nombre)) {
        if (!estadisticas[nombre]) {
          estadisticas[nombre] = { trabajados: 0, noTrabajados: 0 };
        }
        estadisticas[nombre].noTrabajados += 1;
      }
    });
  });

  // Convertir el objeto a un array
  return Object.entries(estadisticas).map(([nombre, datos]) => ({
    nombre,
    diasTrabajados: datos.trabajados,
    diasNoTrabajados: datos.noTrabajados,
  }));
};