export type Enfermero = {
  id: number;
  nombre: string;
  titular: boolean; // true si es titular, false si es suplente
  preferencias: string[]; // Turnos preferidos (pueden ser "Mañana", "Tarde", "Noche")
  rango: string; // "Jefe", "Titular", "Suplente"
  vacaciones: number; // Cantidad de días de vacaciones en el mes
  franco: number; // Cantidad de días de franco en el mes
  diasVacaciones?: number[]; // Días específicos de vacaciones (se generarán)
  diasFranco?: number[]; // Días específicos de franco (se generarán)
};

export type Turno = "M" | "T" | "N";

export type Dia = {
  fecha: string;
  diaSemana: string;
  mañana: Enfermero[];
  tarde: Enfermero[];
  noche: Enfermero[];
};

// Función para convertir preferencias de la base de datos a los valores del código
const convertirPreferencia = (preferencia: string): Turno | null => {
  switch (preferencia) {
    case "Mañana":
      return "M";
    case "Tarde":
      return "T";
    case "Noche":
      return "N";
    default:
      return null; // Si no coincide, devolver null
  }
};

// Función para verificar si un enfermero puede trabajar en un turno específico
const puedeTrabajarTurno = (
  enfermero: Enfermero,
  turno: Turno,
  dia: number,
  historialTurnos: Map<number, Turno[]>,
  diaSemana: string // Día de la semana (Lunes, Martes, etc.)
): boolean => {
  // Verificar si el enfermero está de vacaciones o franco en ese día
  if (enfermero.diasVacaciones!.includes(dia) || enfermero.diasFranco!.includes(dia)) {
    console.warn(`${enfermero.nombre} no puede trabajar el día ${dia} porque está de vacaciones o franco.`);
    return false;
  }

  // Si es un jefe, no aplican las restricciones de 16 horas de descanso
  if (enfermero.rango === "Jefe") {
    return true; // Los jefes siempre pueden trabajar en su turno asignado
  }

  // Verificar las 16 horas de descanso entre turnos (solo para no jefes)
  const turnosAnteriores = historialTurnos.get(enfermero.id) || [];
  if (turnosAnteriores.length > 0) {
    const ultimoTurno = turnosAnteriores[turnosAnteriores.length - 1];
    if (ultimoTurno === "N" && turno === "M") {
      console.warn(`${enfermero.nombre} no puede trabajar en la mañana después de la noche.`);
      return false; // No puede trabajar en la mañana después de la noche
    }
    if (ultimoTurno === "T" && turno === "N") {
      console.warn(`${enfermero.nombre} no puede trabajar en la noche después de la tarde.`);
      return false; // No puede trabajar en la noche después de la tarde
    }
    if (ultimoTurno === turno) {
      // Verificar si tiene días de franco disponibles
      const francosDisponibles = enfermero.diasFranco!.filter((f) => f >= dia + 1 && f <= dia + 2);
      if (francosDisponibles.length >= 2) {
        // Usar los días de franco disponibles
        enfermero.diasFranco = enfermero.diasFranco!.filter((f) => !francosDisponibles.includes(f)); // Eliminar los francos usados
        console.log(`${enfermero.nombre} trabajó dos ${turno} seguidos. Se usaron 2 días de franco disponibles.`);
      } else {
        console.warn(`${enfermero.nombre} trabajó dos ${turno} seguidos, pero no tiene suficientes días de franco disponibles.`);
        return false;
      }
    }
  }

  return true;
};

// Función para asignar turnos
const asignarTurno = (
  titulares: Enfermero[],
  suplentes: Enfermero[],
  turno: Turno,
  minimo: number,
  maximo: number,
  enfermerosAsignadosHoy: Set<number>, // Enfermeros ya asignados hoy
  permiteJefes: boolean = false, // Permite jefes solo entre semana
  dia: number,
  historialTurnos: Map<number, Turno[]>,
  diaSemana: string, // Día de la semana (Lunes, Martes, etc.)
  jefeManana?: Enfermero, // Jefe con preferencia en mañana
  jefeTarde?: Enfermero // Jefe con preferencia en tarde
): Enfermero[] => {
  let seleccionados: Enfermero[] = [];

  // Crear copias de las listas de titulares y suplentes para no modificar las originales
  let titularesDisponibles = [...titulares];
  let suplentesDisponibles = [...suplentes];

  // Si el turno permite jefes y es de lunes a viernes, asignar un jefe primero
  if (permiteJefes && ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana)) {
    if (turno === "M" && jefeManana) {
      // Verificar si el jefe de mañana está disponible y no ha sido asignado hoy
      if (!enfermerosAsignadosHoy.has(jefeManana.id)) {
        if (puedeTrabajarTurno(jefeManana, turno, dia, historialTurnos, diaSemana)) {
          seleccionados.push(jefeManana); // Asignar el jefe de mañana
          enfermerosAsignadosHoy.add(jefeManana.id); // Marcar al jefe como asignado hoy
          console.log(`Jefe de mañana (${jefeManana.nombre}) asignado el día ${dia}.`);
        } else {
          console.warn(`${jefeManana.nombre} no puede trabajar el día ${dia} en el turno ${turno}.`);
        }
      }
    } else if (turno === "T" && jefeTarde) {
      // Verificar si el jefe de tarde está disponible y no ha sido asignado hoy
      if (!enfermerosAsignadosHoy.has(jefeTarde.id)) {
        if (puedeTrabajarTurno(jefeTarde, turno, dia, historialTurnos, diaSemana)) {
          seleccionados.push(jefeTarde); // Asignar el jefe de tarde
          enfermerosAsignadosHoy.add(jefeTarde.id); // Marcar al jefe como asignado hoy
          console.log(`Jefe de tarde (${jefeTarde.nombre}) asignado el día ${dia}.`);
        } else {
          console.warn(`${jefeTarde.nombre} no puede trabajar el día ${dia} en el turno ${turno}.`);
        }
      }
    }
  }

  // Filtrar enfermeros no jefes si el turno no permite jefes
  if (!permiteJefes) {
    titularesDisponibles = titularesDisponibles.filter((e) => e.rango !== "Jefe"); // Excluir jefes
    suplentesDisponibles = suplentesDisponibles.filter((e) => e.rango !== "Jefe"); // Excluir jefes
  }

  // Asignar titulares que tengan preferencia por el turno y puedan trabajar
  const titularesPreferencia = titularesDisponibles
    .filter((e) => e.preferencias.some((p) => convertirPreferencia(p) === turno) && puedeTrabajarTurno(e, turno, dia, historialTurnos, diaSemana) && !enfermerosAsignadosHoy.has(e.id))
    .slice(0, maximo - seleccionados.length);

  seleccionados = [...seleccionados, ...titularesPreferencia];

  // Si no hay suficientes titulares, asignar suplentes con preferencia
  while (seleccionados.length < minimo && suplentesDisponibles.length > 0) {
    const suplente = suplentesDisponibles.find((e) => e.preferencias.some((p) => convertirPreferencia(p) === turno) && puedeTrabajarTurno(e, turno, dia, historialTurnos, diaSemana) && !enfermerosAsignadosHoy.has(e.id));
    if (suplente) {
      seleccionados.push(suplente); // Agrega el suplente
      suplentesDisponibles = suplentesDisponibles.filter((e) => e !== suplente); // Remueve el suplente de la lista de disponibles
      enfermerosAsignadosHoy.add(suplente.id); // Marcar al suplente como asignado hoy
    } else {
      break; // Si no hay más suplentes con preferencia, salir del bucle
    }
  }

  // Si aún no hay suficientes, asignar cualquier enfermero disponible (sin importar preferencias)
  while (seleccionados.length < minimo && (titularesDisponibles.length > 0 || suplentesDisponibles.length > 0)) {
    if (titularesDisponibles.length > 0) {
      const titular = titularesDisponibles.pop()!;
      if (puedeTrabajarTurno(titular, turno, dia, historialTurnos, diaSemana) && !enfermerosAsignadosHoy.has(titular.id)) {
        seleccionados.push(titular);
        enfermerosAsignadosHoy.add(titular.id); // Marcar al titular como asignado hoy
      }
    } else if (suplentesDisponibles.length > 0) {
      const suplente = suplentesDisponibles.pop()!;
      if (puedeTrabajarTurno(suplente, turno, dia, historialTurnos, diaSemana) && !enfermerosAsignadosHoy.has(suplente.id)) {
        seleccionados.push(suplente);
        enfermerosAsignadosHoy.add(suplente.id); // Marcar al suplente como asignado hoy
      }
    }
  }

  // Limitar el número máximo de enfermeros por turno
  if (seleccionados.length > maximo) {
    seleccionados = seleccionados.slice(0, maximo);
  }

  // Si no hay suficientes enfermeros, mostrar una advertencia
  if (seleccionados.length < minimo) {
    console.warn(`No hay suficientes enfermeros para el turno ${turno}. Solo se asignaron ${seleccionados.length} enfermeros.`);
  }

  return seleccionados;
};

// Función para generar los turnos del mes
export const generarTurnos = (enfermeros: Enfermero[], mes: number, año: number): Dia[] => {
  const diasDelMes = new Date(año, mes, 0).getDate();
  const calendario: Dia[] = [];
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const historialTurnos = new Map<number, Turno[]>(); // Historial de turnos por enfermero

  // Generar los días específicos de vacaciones y francos para cada enfermero
  enfermeros.forEach((enfermero) => {
    enfermero.diasVacaciones = generarDiasAleatorios(enfermero.vacaciones, diasDelMes);
    enfermero.diasFranco = generarDiasAleatorios(enfermero.franco, diasDelMes);
  });

  // Obtener los jefes
  const jefeManana = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "M"));
  const jefeTarde = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "T"));

  console.log("Jefes encontrados:");
  console.log("Jefe Mañana:", jefeManana?.nombre);
  console.log("Jefe Tarde:", jefeTarde?.nombre);

  // Generar los turnos del mes
  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fecha = `${año}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
    const diaSemana = diasSemana[new Date(año, mes - 1, dia).getDay()];

    console.log(`\n--- Día ${dia} (${diaSemana}) ---`);

    // Filtrar enfermeros disponibles para este día
    let disponibles = enfermeros.filter(
      (e) =>
        !e.diasVacaciones!.includes(dia) && // Verifica si está de vacaciones
        !e.diasFranco!.includes(dia) // Verifica si está de franco
    );

    console.log("Enfermeros disponibles:", disponibles.map((e) => e.nombre).join(", "));

    // Ordenar enfermeros según preferencias de turno
    let titulares = shuffleArray(disponibles.filter((e) => e.titular));
    let suplentes = shuffleArray(disponibles.filter((e) => !e.titular));

    console.log("Titulares disponibles:", titulares.map((e) => e.nombre).join(", "));
    console.log("Suplentes disponibles:", suplentes.map((e) => e.nombre).join(", "));

    // Crear un Set para llevar un registro de los enfermeros asignados hoy
    const enfermerosAsignadosHoy = new Set<number>();

    // Asignar turnos (pasando diaSemana como parámetro)
    const mañana = asignarTurno(
      titulares,
      suplentes,
      "M",
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4, // 3 enfermeros fines de semana, 4 entre semana
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      enfermerosAsignadosHoy, // Pasar el Set de enfermeros asignados hoy
      ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana), // Permite jefes solo entre semana
      dia,
      historialTurnos,
      diaSemana,
      jefeManana,
      jefeTarde
    );

    const tarde = asignarTurno(
      titulares,
      suplentes,
      "T",
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4, // 3 enfermeros fines de semana, 4 entre semana
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      enfermerosAsignadosHoy, // Pasar el Set de enfermeros asignados hoy
      ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana), // Permite jefes solo entre semana
      dia,
      historialTurnos,
      diaSemana,
      jefeManana,
      jefeTarde
    );

    const noche = asignarTurno(
      titulares,
      suplentes,
      "N",
      2, // Siempre 2 enfermeros en la noche
      2,
      enfermerosAsignadosHoy, // Pasar el Set de enfermeros asignados hoy
      false, // No permite jefes en la noche
      dia,
      historialTurnos,
      diaSemana,
      jefeManana,
      jefeTarde
    );

    console.log("Turno Mañana:", mañana.map((e) => e.nombre).join(", "));
    console.log("Turno Tarde:", tarde.map((e) => e.nombre).join(", "));
    console.log("Turno Noche:", noche.map((e) => e.nombre).join(", "));

    // Actualizar el historial de turnos
    mañana.forEach((e) => {
      if (!historialTurnos.has(e.id)) historialTurnos.set(e.id, []);
      historialTurnos.get(e.id)!.push("M");
    });
    tarde.forEach((e) => {
      if (!historialTurnos.has(e.id)) historialTurnos.set(e.id, []);
      historialTurnos.get(e.id)!.push("T");
    });
    noche.forEach((e) => {
      if (!historialTurnos.has(e.id)) historialTurnos.set(e.id, []);
      historialTurnos.get(e.id)!.push("N");
    });

    calendario.push({ fecha, diaSemana, mañana, tarde, noche });
  }

  return calendario;
};

// Mezclar aleatoriamente un array
const shuffleArray = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
};

// Función para generar días aleatorios dentro del mes
const generarDiasAleatorios = (cantidad: number, diasDelMes: number): number[] => {
  let dias: number[] = [];
  while (dias.length < cantidad) {
    let diaAleatorio = Math.floor(Math.random() * diasDelMes) + 1;
    if (!dias.includes(diaAleatorio)) {
      dias.push(diaAleatorio);
    }
  }
  return dias;
};
