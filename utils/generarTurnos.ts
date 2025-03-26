export type Enfermero = {
  id: number;
  nombre: string;
  titular: boolean; // true si es titular, false si es suplente
  preferencias: string[]; // Turnos preferidos (pueden ser "Mañana", "Tarde", "Noche")
  rango: string; // "Jefe", "Titular", "Suplente"
  vacaciones: number; // Cantidad de días de vacaciones en el mes
  franco: number; // Cantidad de días de franco en el mes (no se usa directamente)
  diasVacaciones?: number[]; // Días específicos de vacaciones (se generarán)
  diasFranco?: number[]; // Días específicos de franco (se asignan dinámicamente)
};

export type Turno = "M" | "T" | "N";

export type Dia = {
  fecha: string;
  diaSemana: string;
  mañana: Enfermero[];
  tarde: Enfermero[];
  noche: Enfermero[];
};


export type DiasTrabajadosMap = Map<number, number>;

export const convertirPreferencia = (preferencia: string): Turno | null => {
  switch (preferencia) {
    case "Mañana": return "M";
    case "Tarde": return "T";
    case "Noche": return "N";
    default: return null;
  }
};

const identificarEnfermerosSinNoche = (enfermeros: Enfermero[]): Enfermero[] => {
  return enfermeros.filter(
    (e) => e.preferencias.includes("Mañana") &&
           e.preferencias.includes("Tarde") &&
           !e.preferencias.includes("Noche")
  );
};

const puedeTrabajarTurno = (
  enfermero: Enfermero,
  turno: Turno,
  dia: number,
  historialTurnos: Map<number, Turno[]>,
  diaSemana: string,
  diasDelMes: number
): boolean => {
  if (enfermero.diasVacaciones?.includes(dia)) return false;
  if (enfermero.rango === "Jefe") return true;

  const turnosAnteriores = historialTurnos.get(enfermero.id) || [];
  
  // Lógica para asignar días de franco
  if (turnosAnteriores.length >= 2 && turnosAnteriores.slice(-2).every((t) => t === turno)) {
    const diaFranco = dia + 1;
    if (diaFranco <= diasDelMes) {
      enfermero.diasFranco = enfermero.diasFranco || [];
      enfermero.diasFranco.push(diaFranco);
    }
  }

  return true;
};

const asignarTurno = (
  titulares: Enfermero[],
  suplentes: Enfermero[],
  turno: Turno,
  minimo: number,
  maximo: number,
  enfermerosAsignadosHoy: Set<number>,
  permiteJefes: boolean = false,
  dia: number,
  historialTurnos: Map<number, Turno[]>,
  diaSemana: string,
  diasDelMes: number,
  diasTrabajadosPorEnfermero: Map<number, number>,
  jefeManana?: Enfermero,
  jefeTarde?: Enfermero
): Enfermero[] => {
  let seleccionados: Enfermero[] = [];

  const titularesDisponibles = titulares.filter(
    (e) => !e.diasVacaciones?.includes(dia) && !e.diasFranco?.includes(dia)
  );
  const suplentesDisponibles = suplentes.filter(
    (e) => !e.diasVacaciones?.includes(dia) && !e.diasFranco?.includes(dia)
  );

  const ordenarPorDiasTrabajados = (a: Enfermero, b: Enfermero) => {
    const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
    const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
    return diasA - diasB;
  };

  titularesDisponibles.sort(ordenarPorDiasTrabajados);
  suplentesDisponibles.sort(ordenarPorDiasTrabajados);

  if (permiteJefes && ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana)) {
    if (turno === "M" && jefeManana && puedeTrabajarTurno(jefeManana, turno, dia, historialTurnos, diaSemana, diasDelMes)) {
      seleccionados.push(jefeManana);
      enfermerosAsignadosHoy.add(jefeManana.id);
    } else if (turno === "T" && jefeTarde && puedeTrabajarTurno(jefeTarde, turno, dia, historialTurnos, diaSemana, diasDelMes)) {
      seleccionados.push(jefeTarde);
      enfermerosAsignadosHoy.add(jefeTarde.id);
    }
  }

  const todosDisponibles = [...titularesDisponibles, ...suplentesDisponibles];
  todosDisponibles.sort(ordenarPorDiasTrabajados);

  while (seleccionados.length < minimo && todosDisponibles.length > 0) {
    const enfermero = todosDisponibles.shift()!;
    if (puedeTrabajarTurno(enfermero, turno, dia, historialTurnos, diaSemana, diasDelMes) &&
        !enfermerosAsignadosHoy.has(enfermero.id)) {
      seleccionados.push(enfermero);
      enfermerosAsignadosHoy.add(enfermero.id);
    }
  }

  if (seleccionados.length > maximo) {
    seleccionados = seleccionados.slice(0, maximo);
  }

  seleccionados.forEach((enfermero) => {
    const diasTrabajados = diasTrabajadosPorEnfermero.get(enfermero.id) || 0;
    diasTrabajadosPorEnfermero.set(enfermero.id, diasTrabajados + 1);
  });

  return seleccionados;
};

export const generarTurnos = (enfermeros: Enfermero[], mes: number, año: number): {calendario: Dia[], diasTrabajados: DiasTrabajadosMap} => {
  const diasDelMes = new Date(año, mes, 0).getDate();
  const calendario: Dia[] = [];
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const historialTurnos = new Map<number, Turno[]>();

  enfermeros.forEach((enfermero) => {
    enfermero.diasFranco = [];
    enfermero.diasVacaciones = generarDiasAleatorios(enfermero.vacaciones, diasDelMes);
  });

  const jefeManana = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "M"));
  const jefeTarde = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "T"));

  const diasTrabajadosPorEnfermero = new Map<number, number>();
  enfermeros.forEach((enfermero) => {
    diasTrabajadosPorEnfermero.set(enfermero.id, 0);
  });

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fecha = `${año}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
    const diaSemana = diasSemana[new Date(año, mes - 1, dia).getDay()];

    let disponibles = enfermeros.filter((e) => !e.diasVacaciones?.includes(dia));
    let titulares = shuffleArray(disponibles.filter((e) => e.rango === "Titular"));
    let suplentes = shuffleArray(disponibles.filter((e) => e.rango === "Suplente"));

    const enfermerosAsignadosHoy = new Set<number>();

    const mañana = asignarTurno(
      titulares,
      suplentes,
      "M",
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      enfermerosAsignadosHoy,
      ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana),
      dia,
      historialTurnos,
      diaSemana,
      diasDelMes,
      diasTrabajadosPorEnfermero,
      jefeManana,
      jefeTarde
    );

    const tarde = asignarTurno(
      titulares,
      suplentes,
      "T",
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      diaSemana === "Sábado" || diaSemana === "Domingo" ? 3 : 4,
      enfermerosAsignadosHoy,
      ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(diaSemana),
      dia,
      historialTurnos,
      diaSemana,
      diasDelMes,
      diasTrabajadosPorEnfermero,
      jefeManana,
      jefeTarde
    );

    const noche = asignarTurno(
      titulares,
      suplentes,
      "N",
      2,
      2,
      enfermerosAsignadosHoy,
      false,
      dia,
      historialTurnos,
      diaSemana,
      diasDelMes,
      diasTrabajadosPorEnfermero,
      jefeManana,
      jefeTarde
    );

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

  return {
    calendario,
    diasTrabajados: diasTrabajadosPorEnfermero
  };
};

const shuffleArray = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
};

const generarDiasAleatorios = (dias: number, diasDelMes: number): number[] => {
  let diasAleatorios: number[] = [];
  while (diasAleatorios.length < dias) {
    const dia = Math.floor(Math.random() * diasDelMes) + 1;
    if (!diasAleatorios.includes(dia)) {
      diasAleatorios.push(dia);
    }
  }
  return diasAleatorios.sort((a, b) => a - b);
};
