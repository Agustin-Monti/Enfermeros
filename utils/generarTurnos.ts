export type Turno = "M" | "T" | "N";

export type Enfermero = {
  id: number;
  nombre: string;
  titular: boolean;
  preferencias: Turno[];
  rango: "Jefe" | "Titular" | "Suplente";
  vacaciones: number;
  franco: number;
  diasVacaciones?: number[];
  diasFranco?: number[];
  diasTrabajadosObjetivo?: number;
  diasConsecutivosTrabajados?: number;
  ultimoDiaTrabajado?: number;
  _exclusionReason?: string; // Añade esta línea
};

export type Dia = {
  fecha: string;
  diaSemana: string;
  diaNumero: number;
  mañana: Enfermero[];
  tarde: Enfermero[];
  noche: Enfermero[];
};

export interface AusenciaProlongada {
  enfermeroId: number;
  diasAusente: number;
  diasAsignados: number;
  suplentesAsignados: number[];
}

export type DiasTrabajadosMap = Map<number, number>;

export interface ReemplazoHistorico {
  enfermeroAusenteId: number;
  suplenteId: number;
  fecha: string;
  turno: Turno;
  contador: number;
}

// Variable global para el histórico de reemplazos
let historicoReemplazos: ReemplazoHistorico[] = [];

export const cargarHistoricoReemplazos = (): ReemplazoHistorico[] => {
  try {
    const historico = localStorage.getItem('historicoReemplazos');
    return historico ? JSON.parse(historico) : [];
  } catch (error) {
    console.error("Error al cargar histórico de reemplazos:", error);
    return [];
  }
};

export const guardarHistoricoReemplazos = (historico: ReemplazoHistorico[]) => {
  try {
    localStorage.setItem('historicoReemplazos', JSON.stringify(historico));
  } catch (error) {
    console.error("Error al guardar histórico de reemplazos:", error);
  }
};


historicoReemplazos = cargarHistoricoReemplazos();

const registrarReemplazo = (
  enfermeroAusenteId: number,
  suplenteId: number,
  fecha: string,
  turno: Turno
) => {
  const existente = historicoReemplazos.find(r => 
    r.enfermeroAusenteId === enfermeroAusenteId && 
    r.suplenteId === suplenteId
  );
  
  if (existente) {
    existente.contador++;
    existente.fecha = fecha;
  } else {
    historicoReemplazos.push({
      enfermeroAusenteId,
      suplenteId,
      fecha,
      turno,
      contador: 1
    });
  }
  
  guardarHistoricoReemplazos(historicoReemplazos);
};

export const convertirPreferencia = (preferencia: string): Turno | null => {
  switch (preferencia) {
    case "Mañana": return "M";
    case "Tarde": return "T";
    case "Noche": return "N";
    default: return null;
  }
};

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
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

export const detectarAusenciasProlongadas = (
  ausencias: { enfermeroId?: number; fechaInicio: string; fechaFin: string }[],
  mes: number,
  año: number
): AusenciaProlongada[] => {
  const diasDelMes = new Date(año, mes, 0).getDate();
  const ausenciasProlongadas: AusenciaProlongada[] = [];

  ausencias.forEach(ausencia => {
    if (!ausencia.enfermeroId) return;
    
    const inicio = new Date(ausencia.fechaInicio);
    const fin = new Date(ausencia.fechaFin);
    const diasAusente = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Consideramos "prolongada" una ausencia de más de 7 días
    if (diasAusente > 7) {
      ausenciasProlongadas.push({
        enfermeroId: ausencia.enfermeroId,
        diasAusente,
        diasAsignados: 0,
        suplentesAsignados: []
      });
    }
  });

  return ausenciasProlongadas;
};

const encontrarSuplenteParaAusenciaProlongada = (
  enfermeroAusente: Enfermero,
  suplentesDisponibles: Enfermero[],
  ausenciaProlongada: AusenciaProlongada,
  diasTrabajadosPorEnfermero: Map<number, number>,
  fecha: string
): Enfermero | undefined => {
  // Filtrar suplentes que no han sido asignados a este enfermero ausente
  const suplentesElegibles = suplentesDisponibles.filter(suplente => 
    !ausenciaProlongada.suplentesAsignados.includes(suplente.id)
  );

  if (suplentesElegibles.length === 0) {
    // Si todos los suplentes ya fueron asignados, elegir el que tenga menos reemplazos
    return suplentesDisponibles.sort((a, b) => {
      const reemplazosA = historicoReemplazos
        .filter(r => r.suplenteId === a.id && r.enfermeroAusenteId === enfermeroAusente.id)
        .reduce((sum, r) => sum + r.contador, 0);
      
      const reemplazosB = historicoReemplazos
        .filter(r => r.suplenteId === b.id && r.enfermeroAusenteId === enfermeroAusente.id)
        .reduce((sum, r) => sum + r.contador, 0);
      
      return reemplazosA - reemplazosB;
    })[0];
  }

  // Distribución equitativa entre suplentes
  return suplentesElegibles.sort((a, b) => {
    // Primero por días trabajados totales
    const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
    const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
    
    if (diasA !== diasB) return diasA - diasB;
    
    // Luego por reemplazos a este enfermero
    const reemplazosA = historicoReemplazos
      .filter(r => r.suplenteId === a.id && r.enfermeroAusenteId === enfermeroAusente.id)
      .reduce((sum, r) => sum + r.contador, 0);
    
    const reemplazosB = historicoReemplazos
      .filter(r => r.suplenteId === b.id && r.enfermeroAusenteId === enfermeroAusente.id)
      .reduce((sum, r) => sum + r.contador, 0);
    
    return reemplazosA - reemplazosB;
  })[0];
};

const contarAsignacionesRecientes = (
  enfermeroId: number,
  calendario: Dia[],
  fechaActual: string,
  diasAtras: number
): number => {
  const fechaObj = new Date(fechaActual);
  let contador = 0;
  
  for (let i = 1; i <= diasAtras; i++) {
    const fechaAnterior = new Date(fechaObj);
    fechaAnterior.setDate(fechaObj.getDate() - i);
    const fechaStr = fechaAnterior.toISOString().split('T')[0];
    
    const dia = calendario.find(d => d.fecha === fechaStr);
    if (dia) {
      if ([...dia.mañana, ...dia.tarde, ...dia.noche].some(e => e.id === enfermeroId)) {
        contador++;
      }
    }
  }
  
  return contador;
};

export const reemplazarEnfermero = (
  turno: Enfermero[], 
  fecha: string,
  enfermerosNoDisponibles: string[],
  ausencias: { enfermeroId?: number; nombre: string; fechaInicio: string; fechaFin: string }[],
  turnoTipo: "mañana" | "tarde" | "noche",
  diasTrabajadosPorEnfermero: Map<number, number>,
  ausenciasProlongadas: AusenciaProlongada[],
  listaEnfermeros: Enfermero[]
): Enfermero[] => {
  return turno.map((enfermero) => {
    if (enfermerosNoDisponibles.includes(enfermero.nombre)) {
      const ausencia = ausencias.find(a => 
        a.nombre === enfermero.nombre && 
        new Date(fecha) >= new Date(a.fechaInicio) && 
        new Date(fecha) <= new Date(a.fechaFin)
      );
      
      if (ausencia && ausencia.enfermeroId) {
        const enfermeroAusente = listaEnfermeros.find(e => e.id === ausencia.enfermeroId);
        if (!enfermeroAusente) return enfermero;

        const ausenciaProlongada = ausenciasProlongadas.find(ap => ap.enfermeroId === enfermeroAusente.id);
        
        const suplentesDisponibles = listaEnfermeros.filter(
          (e: Enfermero) => 
            e.rango === "Suplente" &&
            !enfermerosNoDisponibles.includes(e.nombre) &&
            !turno.includes(e) &&
            (diasTrabajadosPorEnfermero.get(e.id) || 0) < 12
        );

        if (ausenciaProlongada && suplentesDisponibles.length > 0) {
          // Lógica para ausencias prolongadas
          const suplente = encontrarSuplenteParaAusenciaProlongada(
            enfermeroAusente,
            suplentesDisponibles,
            ausenciaProlongada,
            diasTrabajadosPorEnfermero,
            fecha
          );

          if (suplente) {
            registrarReemplazo(enfermeroAusente.id, suplente.id, fecha, 
              turnoTipo === "mañana" ? "M" : turnoTipo === "tarde" ? "T" : "N");
            
            // Actualizar la ausencia prolongada
            ausenciaProlongada.diasAsignados++;
            if (!ausenciaProlongada.suplentesAsignados.includes(suplente.id)) {
              ausenciaProlongada.suplentesAsignados.push(suplente.id);
            }
            
            return suplente;
          }
        } else {
          // Lógica normal para ausencias cortas
          const suplentes = listaEnfermeros.filter(
            (e: Enfermero) => 
              e.rango === "Suplente" && 
              !enfermerosNoDisponibles.includes(e.nombre) &&
              !turno.includes(e) &&
              (diasTrabajadosPorEnfermero.get(e.id) || 0) < 12
          );

          if (suplentes.length > 0) {
            const suplente = suplentes.sort((a: Enfermero, b: Enfermero) => {
              const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
              const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
              return diasA - diasB;
            })[0];

            if (suplente) {
              registrarReemplazo(enfermeroAusente.id, suplente.id, fecha, 
                turnoTipo === "mañana" ? "M" : turnoTipo === "tarde" ? "T" : "N");
              return suplente;
            }
          }
        }
      }
    }
    return enfermero;
  });
};

const necesitaFranco = (enfermero: Enfermero, diaActual: number): boolean => {
  if (enfermero.rango === "Jefe") return false;
  
  // Si ha trabajado 2 días seguidos, necesita 1 día de franco
  if ((enfermero.diasConsecutivosTrabajados || 0) >= 2 && 
      diaActual === (enfermero.ultimoDiaTrabajado || 0) + 1) {
    return true;
  }
  
  // Si ha trabajado 4 días seguidos, necesita 2 días de franco
  if ((enfermero.diasConsecutivosTrabajados || 0) >= 4 && 
      diaActual <= (enfermero.ultimoDiaTrabajado || 0) + 2) {
    return true;
  }
  
  return false;
};

const manejarFrancosAutomaticos = (enfermero: Enfermero, diaNumero: number) => {
  const diasConsecutivos = enfermero.diasConsecutivosTrabajados || 0;
  
  enfermero.diasFranco = enfermero.diasFranco || [];
  
  if (diasConsecutivos >= 2) {
    const francoDia = diaNumero + 1;
    if (!enfermero.diasFranco.includes(francoDia)) {
      enfermero.diasFranco.push(francoDia);
    }
  }
  
  if (diasConsecutivos >= 4) {
    for (let i = 1; i <= 2; i++) {
      const francoDia = diaNumero + i;
      if (!enfermero.diasFranco.includes(francoDia)) {
        enfermero.diasFranco.push(francoDia);
      }
    }
  }
};

const encontrarSuplenteEquitativo = (
  enfermerosDisponibles: Enfermero[],
  enfermeroAusente: Enfermero,
  fecha: string,
  turno: Turno,
  diasTrabajadosPorEnfermero: Map<number, number>
): Enfermero | undefined => {
  const suplentes = enfermerosDisponibles.filter(e => 
    e.rango === "Suplente" && 
    (diasTrabajadosPorEnfermero.get(e.id) || 0) < 12
  );

  if (suplentes.length === 0) return undefined;

  suplentes.sort((a, b) => {
    // Reemplazos a este enfermero específico
    const reemplazosA = historicoReemplazos
      .filter(r => r.suplenteId === a.id && r.enfermeroAusenteId === enfermeroAusente.id)
      .reduce((sum, r) => sum + r.contador, 0);
      
    const reemplazosB = historicoReemplazos
      .filter(r => r.suplenteId === b.id && r.enfermeroAusenteId === enfermeroAusente.id)
      .reduce((sum, r) => sum + r.contador, 0);
    
    if (reemplazosA !== reemplazosB) return reemplazosA - reemplazosB;
    
    // Reemplazos totales
    const totalA = historicoReemplazos
      .filter(r => r.suplenteId === a.id)
      .reduce((sum, r) => sum + r.contador, 0);
      
    const totalB = historicoReemplazos
      .filter(r => r.suplenteId === b.id)
      .reduce((sum, r) => sum + r.contador, 0);
    
    if (totalA !== totalB) return totalA - totalB;
    
    // Días trabajados
    const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
    const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
    return diasA - diasB;
  });

  const suplenteSeleccionado = suplentes[0];
  
  if (suplenteSeleccionado) {
    registrarReemplazo(enfermeroAusente.id, suplenteSeleccionado.id, fecha, turno);
  }
  
  return suplenteSeleccionado;
};

const puedeTrabajarTurno = (
  enfermero: Enfermero,
  turno: Turno,
  diaNumero: number,
  diasTrabajadosPorEnfermero: Map<number, number>,
  noDisponibles: string[],
  calendario: Dia[],
  diaSemana: string
): boolean => {
  // Verificar disponibilidad básica
  if (noDisponibles.includes(enfermero.nombre)) return false;
  if (enfermero.diasVacaciones?.includes(diaNumero)) return false;
  if (enfermero.diasFranco?.includes(diaNumero)) return false;
  
  // Reglas especiales para jefes
  if (enfermero.rango === "Jefe") {
    if (diaSemana === "Sábado" || diaSemana === "Domingo") return false;
    if (enfermero.nombre === "Viviana" && turno !== "M") return false;
    if (enfermero.nombre === "Alonso" && turno !== "T") return false;
  }
  
  // Verificar límites de días trabajados
  const diasTrabajados = diasTrabajadosPorEnfermero.get(enfermero.id) || 0;
  
  if (enfermero.rango === "Titular" && diasTrabajados >= 17) return false;
  if (enfermero.rango === "Suplente" && diasTrabajados >= 12) return false;
  
  // Verificar preferencias de turno (excepto jefes)
  if (enfermero.rango !== "Jefe" && !enfermero.preferencias.includes(turno)) return false;
  
  // Verificar necesidad de franco
  if (necesitaFranco(enfermero, diaNumero)) return false;
  
  // Verificar máximo de días consecutivos
  if ((enfermero.diasConsecutivosTrabajados || 0) >= 4) return false;
  
  return true;
};

const asignarTurno = (
  enfermerosDisponibles: Enfermero[],
  turno: Turno,
  cantidadNecesaria: number,
  enfermerosAsignadosHoy: Set<number>,
  diaNumero: number,
  diasTrabajadosPorEnfermero: Map<number, number>,
  noDisponibles: string[],
  calendario: Dia[],
  diaSemana: string
): Enfermero[] => {
  const seleccionados: Enfermero[] = [];
  const esFinde = diaSemana === "Sábado" || diaSemana === "Domingo";

  // Mezclar los enfermeros disponibles para añadir aleatoriedad
  const enfermerosMezclados = shuffleArray(enfermerosDisponibles);

  // 1. Asignar jefes si no es fin de semana
  if (!esFinde) {
    const jefe = turno === "M" 
      ? enfermerosMezclados.find(e => e.rango === "Jefe" && e.nombre === "Viviana")
      : enfermerosMezclados.find(e => e.rango === "Jefe" && e.nombre === "Alonso");
    
    if (jefe && puedeTrabajarTurno(jefe, turno, diaNumero, diasTrabajadosPorEnfermero, noDisponibles, calendario, diaSemana)) {
      seleccionados.push(jefe);
      enfermerosAsignadosHoy.add(jefe.id);
      
      // Actualizar días trabajados
      const diasTrabajados = (diasTrabajadosPorEnfermero.get(jefe.id) || 0) + 1;
      diasTrabajadosPorEnfermero.set(jefe.id, diasTrabajados);
      
      jefe.ultimoDiaTrabajado = diaNumero;
    }
  }

  // 2. Asignar titulares disponibles que puedan trabajar este turno
  const titularesPendientes = enfermerosMezclados
    .filter(e => 
      e.rango === "Titular" && 
      !enfermerosAsignadosHoy.has(e.id) &&
      puedeTrabajarTurno(e, turno, diaNumero, diasTrabajadosPorEnfermero, noDisponibles, calendario, diaSemana)
    )
    .sort((a, b) => {
      // Priorizar titulares con menos días trabajados
      const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
      const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
      return diasA - diasB;
    });

  for (const titular of titularesPendientes) {
    if (seleccionados.length >= cantidadNecesaria) break;
    
    seleccionados.push(titular);
    enfermerosAsignadosHoy.add(titular.id);
    
    // Actualizar días trabajados
    const diasTrabajados = (diasTrabajadosPorEnfermero.get(titular.id) || 0) + 1;
    diasTrabajadosPorEnfermero.set(titular.id, diasTrabajados);
    
    // Actualizar días consecutivos trabajados
    if (titular.ultimoDiaTrabajado === diaNumero - 1) {
      titular.diasConsecutivosTrabajados = (titular.diasConsecutivosTrabajados || 0) + 1;
    } else {
      titular.diasConsecutivosTrabajados = 1;
    }
    titular.ultimoDiaTrabajado = diaNumero;
    
    // Programar francos si es necesario
    manejarFrancosAutomaticos(titular, diaNumero);
  }

  // 3. Completar con suplentes si faltan enfermeros
  while (seleccionados.length < cantidadNecesaria) {
    // Filtrar suplentes disponibles
    const suplentesDisponibles = enfermerosMezclados.filter(e => 
      e.rango === "Suplente" &&
      !enfermerosAsignadosHoy.has(e.id) &&
      puedeTrabajarTurno(e, turno, diaNumero, diasTrabajadosPorEnfermero, noDisponibles, calendario, diaSemana)
    );

    if (suplentesDisponibles.length === 0) break;

    // Ordenar suplentes por:
    // 1. Menos días trabajados
    // 2. Menos reemplazos históricos
    // 3. Aleatoriedad (ya están mezclados)
    suplentesDisponibles.sort((a, b) => {
      const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
      const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
      
      if (diasA !== diasB) return diasA - diasB;
      
      const reemplazosA = historicoReemplazos
        .filter(r => r.suplenteId === a.id)
        .reduce((sum, r) => sum + r.contador, 0);
      
      const reemplazosB = historicoReemplazos
        .filter(r => r.suplenteId === b.id)
        .reduce((sum, r) => sum + r.contador, 0);
      
      return reemplazosA - reemplazosB;
    });

    const suplente = suplentesDisponibles[0];
    seleccionados.push(suplente);
    enfermerosAsignadosHoy.add(suplente.id);
    
    // Actualizar días trabajados
    const diasTrabajados = (diasTrabajadosPorEnfermero.get(suplente.id) || 0) + 1;
    diasTrabajadosPorEnfermero.set(suplente.id, diasTrabajados);
    
    // Registrar reemplazo si está cubriendo a alguien
    const enfermerosAusentesHoy = enfermerosMezclados
      .filter(e => noDisponibles.includes(e.nombre) && e.rango === "Titular");
    
    if (enfermerosAusentesHoy.length > 0) {
      const enfermeroAusente = enfermerosAusentesHoy[0]; // Tomar el primero
      registrarReemplazo(
        enfermeroAusente.id,
        suplente.id,
        `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${diaNumero}`,
        turno
      );
    }
  }

  return seleccionados;
};

export const generarTurnos = (
  enfermeros: Enfermero[], 
  mes: number, 
  año: number,
  ausencias: Record<string, string[]> = {}
): {calendario: Dia[], diasTrabajados: DiasTrabajadosMap} => {
  const diasDelMes = new Date(año, mes, 0).getDate();
  const calendario: Dia[] = [];
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diasTrabajadosPorEnfermero = new Map<number, number>();

  // Inicializar enfermeros
  enfermeros.forEach(enfermero => {
    enfermero.preferencias = enfermero.preferencias
      .map(p => convertirPreferencia(p))
      .filter(Boolean) as Turno[];
    
    enfermero.diasTrabajadosObjetivo = enfermero.rango === "Titular" ? 17 : 12;
    enfermero.diasFranco = [];
    enfermero.diasVacaciones = generarDiasAleatorios(enfermero.vacaciones, diasDelMes);
    enfermero.diasConsecutivosTrabajados = 0;
    enfermero.ultimoDiaTrabajado = undefined;
    diasTrabajadosPorEnfermero.set(enfermero.id, 0);
  });

  // Generar calendario día por día
  for (let diaNumero = 1; diaNumero <= diasDelMes; diaNumero++) {
    const fecha = `${año}-${mes.toString().padStart(2, "0")}-${diaNumero.toString().padStart(2, "0")}`;
    const diaSemana = diasSemana[new Date(año, mes - 1, diaNumero).getDay()];
    const noDisponibles = ausencias[fecha] || [];
    const esFinde = diaSemana === "Sábado" || diaSemana === "Domingo";

    const dia: Dia = {
      fecha,
      diaSemana,
      diaNumero,
      mañana: [],
      tarde: [],
      noche: []
    };

    // Asignar turnos
    const enfermerosAsignadosHoy = new Set<number>();

    // Convertir ausencias a formato para detectar prolongadas
    const ausenciasArray = Object.entries(ausencias).flatMap(([fecha, nombres]) => 
      nombres.map(nombre => {
        const enfermero = enfermeros.find(e => e.nombre === nombre);
        return {
          enfermeroId: enfermero?.id,
          nombre,
          fechaInicio: fecha,
          fechaFin: fecha
        };
      })
    );

    const ausenciasProlongadas = detectarAusenciasProlongadas(ausenciasArray, mes, año);

    // Asignar turnos con mezcla aleatoria
    dia.mañana = asignarTurno(
      shuffleArray([...enfermeros]), // Mezclar enfermeros para aleatoriedad
      "M",
      esFinde ? 3 : 4,
      enfermerosAsignadosHoy,
      diaNumero,
      diasTrabajadosPorEnfermero,
      noDisponibles,
      calendario,
      diaSemana
    );

    dia.tarde = asignarTurno(
      shuffleArray([...enfermeros]),
      "T",
      esFinde ? 3 : 4,
      enfermerosAsignadosHoy,
      diaNumero,
      diasTrabajadosPorEnfermero,
      noDisponibles,
      calendario,
      diaSemana
    );

    dia.noche = asignarTurno(
      shuffleArray([...enfermeros]),
      "N",
      2,
      enfermerosAsignadosHoy,
      diaNumero,
      diasTrabajadosPorEnfermero,
      noDisponibles,
      calendario,
      diaSemana
    );

    calendario.push(dia);
  }

  return { calendario, diasTrabajados: diasTrabajadosPorEnfermero };
};
