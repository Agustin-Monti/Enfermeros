// utils/generarTurnos.ts

export type Enfermero = {
  id: number;
  nombre: string;
  titular: boolean; // true si es titular, false si es suplente
  preferencias: ("M" | "T" | "N")[]; // Turnos preferidos
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

// Función para asignar turnos
const asignarTurno = (
  titulares: Enfermero[],
  suplentes: Enfermero[],
  turno: Turno,
  minimo: number,
  maximo: number,
  permiteJefes: boolean = false // Indica si el turno permite jefes
): Enfermero[] => {
  let seleccionados: Enfermero[] = [];

  // Si el turno permite jefes, asignar un jefe primero
  if (permiteJefes) {
    const jefe = titulares.find((e) => e.rango === "Jefe" && e.preferencias.includes(turno));
    if (jefe) {
      seleccionados.push(jefe); // Asignar el jefe
      titulares = titulares.filter((e) => e !== jefe); // Remover el jefe de la lista de disponibles
    }
  }

  // Filtrar enfermeros no jefes si el turno no permite jefes
  if (!permiteJefes) {
    titulares = titulares.filter((e) => e.rango !== "Jefe"); // Excluir jefes
    suplentes = suplentes.filter((e) => e.rango !== "Jefe"); // Excluir jefes
  }

  // Asignar titulares que tengan preferencia por el turno
  const titularesPreferencia = titulares
    .filter((e) => e.preferencias.includes(turno)) // Filtra titulares con preferencia
    .slice(0, maximo - seleccionados.length); // Toma los primeros "maximo" titulares

  seleccionados = [...seleccionados, ...titularesPreferencia];

  // Si no hay suficientes titulares, asignar suplentes con preferencia
  while (seleccionados.length < minimo && suplentes.length > 0) {
    const suplente = suplentes.find((e) => e.preferencias.includes(turno)); // Busca suplentes con preferencia
    if (suplente) {
      seleccionados.push(suplente); // Agrega el suplente
      suplentes = suplentes.filter((e) => e !== suplente); // Remueve el suplente de la lista de disponibles
    } else {
      break; // Si no hay más suplentes con preferencia, salir del bucle
    }
  }

  // Si aún no hay suficientes, asignar cualquier enfermero disponible (sin importar preferencias)
  while (seleccionados.length < minimo && (titulares.length > 0 || suplentes.length > 0)) {
    if (titulares.length > 0) {
      seleccionados.push(titulares.pop()!); // Agrega cualquier titular disponible
    } else if (suplentes.length > 0) {
      seleccionados.push(suplentes.pop()!); // Agrega cualquier suplente disponible
    }
  }

  // Limitar el número máximo de enfermeros por turno
  if (seleccionados.length > maximo) {
    seleccionados = seleccionados.slice(0, maximo); // Limita a "maximo" enfermeros
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

  // Generar los días específicos de vacaciones y francos para cada enfermero
  enfermeros.forEach((enfermero) => {
    enfermero.diasVacaciones = generarDiasAleatorios(enfermero.vacaciones, diasDelMes);
    enfermero.diasFranco = generarDiasAleatorios(enfermero.franco, diasDelMes);
  });

  // Generar los turnos del mes
  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fecha = `${año}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
    const diaSemana = diasSemana[new Date(año, mes - 1, dia).getDay()];

    // Filtrar enfermeros disponibles para este día
    let disponibles = enfermeros.filter(
      (e) =>
        !e.diasVacaciones!.includes(dia) && // Verifica si está de vacaciones
        !e.diasFranco!.includes(dia) // Verifica si está de franco
    );

    // Ordenar enfermeros según preferencias de turno
    let titulares = shuffleArray(disponibles.filter((e) => e.titular));
    let suplentes = shuffleArray(disponibles.filter((e) => !e.titular));

    // Asignar turnos
    const mañana = asignarTurno(titulares, suplentes, "M", 3, 4, true); // Permite jefes
    const tarde = asignarTurno(titulares, suplentes, "T", 3, 4, true); // Permite jefes
    const noche = asignarTurno(titulares, suplentes, "N", 3, 4); // No permite jefes

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