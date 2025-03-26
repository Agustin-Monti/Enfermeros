"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generarTurnos, Dia, Enfermero, convertirPreferencia } from "@/utils/generarTurnos";
import { getEnfermerosTurnos, guardarAusencias, guardarCalendario } from "@/actions/enfermero-actions";
import * as XLSX from "xlsx";
import Link from "next/link";
import { verificarAdmin } from "@/actions/auth-actions/actions";
import { getCookie, setCookie } from "cookies-next";

interface Ausencia {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}

const Calendario = () => {
  const [calendario, setCalendario] = useState<Dia[]>([]);
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [enfermeros, setEnfermeros] = useState<Enfermero[]>([]);
  const [enfermerosAusentes, setEnfermerosAusentes] = useState<Record<string, string[]>>({});
  const [enfermerosFindesLibres, setEnfermerosFindesLibres] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
    motivo: "",
  });
  const [mostrarBotonGuardar, setMostrarBotonGuardar] = useState(false);
  const [mostrarBotonGuardarCalendario, setMostrarBotonGuardarCalendario] = useState(false);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [diasTrabajadosPorEnfermero, setDiasTrabajadosPorEnfermero] = useState<Map<number, number>>(new Map());
  const router = useRouter();

  useEffect(() => {
    const verificarAcceso = async () => {
      const admin = await verificarAdmin();
      if (!admin) {
        router.push("/");
      } else {
        setEsAdmin(true);
      }
    };
    verificarAcceso();
  }, [router]);

  useEffect(() => {
    cargarEnfermeros();
    cargarAusenciasDesdeCookies();
  }, []);

  const cargarAusenciasDesdeCookies = () => {
    const ausenciasGuardadas = JSON.parse(getCookie("ausencias") as string || "[]");
    setAusencias(ausenciasGuardadas);
    if (ausenciasGuardadas.length > 0) {
      ausenciasGuardadas.forEach((ausencia: Ausencia) => {
        agregarAusencia(ausencia.nombre, ausencia.fechaInicio, ausencia.fechaFin, ausencia.motivo);
      });
      setMostrarBotonGuardar(true);
    }
  };

  const guardarAusenciasEnCookies = (ausencias: Ausencia[]) => {
    setCookie("ausencias", JSON.stringify(ausencias));
  };

  const encontrarSuplenteAdecuado = (
    turnoActual: Enfermero[],
    enfermerosNoDisponibles: string[],
    fecha: string
  ): Enfermero | undefined => {
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.toLocaleDateString("es-ES", { weekday: "long" });
    
    const suplentesDisponibles = enfermeros.filter(
      e => e.rango === "Suplente" && 
           !enfermerosNoDisponibles.includes(e.nombre) &&
           !turnoActual.includes(e)
    );
    
    suplentesDisponibles.sort((a, b) => {
      const diasA = diasTrabajadosPorEnfermero.get(a.id) || 0;
      const diasB = diasTrabajadosPorEnfermero.get(b.id) || 0;
      return diasA - diasB;
    });
    
    for (const suplente of suplentesDisponibles) {
      const fechaAnterior = new Date(fechaObj);
      fechaAnterior.setDate(fechaObj.getDate() - 1);
      
      const fechaPosterior = new Date(fechaObj);
      fechaPosterior.setDate(fechaObj.getDate() + 1);
      
      const estaEnTurnoAnterior = calendario.some(dia => 
        dia.fecha === fechaAnterior.toISOString().split('T')[0] &&
        (dia.mañana.includes(suplente) || dia.tarde.includes(suplente) || dia.noche.includes(suplente))
      );
      
      const estaEnTurnoPosterior = calendario.some(dia => 
        dia.fecha === fechaPosterior.toISOString().split('T')[0] &&
        (dia.mañana.includes(suplente) || dia.tarde.includes(suplente) || dia.noche.includes(suplente))
      );
      
      if (!estaEnTurnoAnterior && !estaEnTurnoPosterior) {
        return suplente;
      }
    }
    
    return suplentesDisponibles[0];
  };

  // Función reemplazarEnfermero actualizada
  const reemplazarEnfermero = (
    turno: Enfermero[], 
    fecha: string,
    enfermerosNoDisponibles: string[]
  ): Enfermero[] => {
    return turno.map((enfermero) => {
      if (enfermerosNoDisponibles.includes(enfermero.nombre)) {
        const suplente = encontrarSuplenteAdecuado(turno, enfermerosNoDisponibles, fecha);
        return suplente || enfermero;
      }
      return enfermero;
    });
  };

  // Modificar el useEffect que maneja cambios en el calendario
  useEffect(() => {
    setCalendario((prevCalendario) => {
      const calendarioActualizado = prevCalendario.map((dia) => {
        const fechaStr = dia.fecha;
        const enfermerosNoDisponibles = [
          ...(enfermerosAusentes[fechaStr] || []),
          ...(enfermerosFindesLibres[fechaStr] || []),
        ];

        return {
          ...dia,
          mañana: reemplazarEnfermero([...dia.mañana], fechaStr, enfermerosNoDisponibles),
          tarde: reemplazarEnfermero([...dia.tarde], fechaStr, enfermerosNoDisponibles),
          noche: reemplazarEnfermero([...dia.noche], fechaStr, enfermerosNoDisponibles),
        };
      });
      return calendarioActualizado;
    });
  }, [enfermerosAusentes, enfermerosFindesLibres]);

  const cargarEnfermeros = async () => {
    setLoading(true);
    try {
      const data = await getEnfermerosTurnos();
      setEnfermeros(data);
      
      // Inicializar días trabajados
      const nuevosDiasTrabajados = new Map<number, number>();
      data.forEach(e => nuevosDiasTrabajados.set(e.id, 0));
      setDiasTrabajadosPorEnfermero(nuevosDiasTrabajados);
    } catch (error) {
      console.error("Error al cargar enfermeros:", error);
    }
    setLoading(false);
  };

  // Modificar la función cargarTurnos
  const cargarTurnos = () => {
    setLoading(true);
    const { calendario: turnosGenerados, diasTrabajados } = generarTurnos(enfermeros, mes, año);
    
    setDiasTrabajadosPorEnfermero(diasTrabajados);
    setCalendario(turnosGenerados);
    setMostrarBotonGuardarCalendario(true);
    setLoading(false);
  };

  // Función para actualizar días trabajados cuando hay ausencias
  const actualizarDiasTrabajadosPorAusencia = (
    enfermeroAusente: Enfermero,
    fechaInicio: string,
    fechaFin: string,
    suplente?: Enfermero
  ) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const nuevosDiasTrabajados = new Map(diasTrabajadosPorEnfermero);
    
    // Calcular cantidad de días de ausencia (excluyendo fines de semana)
    let diasAusencia = 0;
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Excluir domingo (0) y sábado (6)
        diasAusencia++;
      }
    }

    // Reducir días trabajados del enfermero ausente
    const diasActualesAusente = nuevosDiasTrabajados.get(enfermeroAusente.id) || 0;
    nuevosDiasTrabajados.set(
      enfermeroAusente.id, 
      Math.max(0, diasActualesAusente - diasAusencia) // No permitir valores negativos
    );

    // Aumentar días trabajados del suplente si existe
    if (suplente) {
      const diasActualesSuplente = nuevosDiasTrabajados.get(suplente.id) || 0;
      nuevosDiasTrabajados.set(suplente.id, diasActualesSuplente + diasAusencia);
    }

    setDiasTrabajadosPorEnfermero(nuevosDiasTrabajados);
  };

  // Función modificada para agregar ausencias
  const agregarAusencia = (nombre: string, fechaInicio: string, fechaFin: string, motivo: string) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const enfermeroAusente = enfermeros.find((e) => e.nombre === nombre);

    if (enfermeroAusente) {
      const fechasAusencia: string[] = [];
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        fechasAusencia.push(d.toISOString().split("T")[0]);
      }

      // Encontrar suplente para el primer día (asumimos mismo suplente para todos los días)
      const primerDia = fechasAusencia[0];
      const turnoPrimerDia = calendario.find(d => d.fecha === primerDia)?.mañana || [];
      const suplente = encontrarSuplenteAdecuado(turnoPrimerDia, [nombre], primerDia);

      // Actualizar días trabajados
      actualizarDiasTrabajadosPorAusencia(enfermeroAusente, fechaInicio, fechaFin, suplente);

      setEnfermerosAusentes((prev) => {
        const nuevasAusencias = { ...prev };
        fechasAusencia.forEach((fecha) => {
          if (!nuevasAusencias[fecha]) {
            nuevasAusencias[fecha] = [];
          }
          if (!nuevasAusencias[fecha].includes(nombre)) {
            nuevasAusencias[fecha].push(nombre);
          }
        });
        return nuevasAusencias;
      });

      const nuevaAusencia: Ausencia = { nombre, fechaInicio, fechaFin, motivo };
      const nuevasAusencias = [...ausencias, nuevaAusencia];
      setAusencias(nuevasAusencias);
      guardarAusenciasEnCookies(nuevasAusencias);
      setMostrarBotonGuardar(true);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const eliminarAusencia = (index: number) => {
    const nuevasAusencias = [...ausencias];
    nuevasAusencias.splice(index, 1);
    setAusencias(nuevasAusencias);
    guardarAusenciasEnCookies(nuevasAusencias);
  };
  
  const eliminarTodasAusencias = () => {
    setAusencias([]);
    guardarAusenciasEnCookies([]);
    setMostrarBotonGuardar(false);
  };

  const handleGuardarTodasAusencias = async () => {
    if (ausencias.length === 0) {
      alert("No hay ausencias para guardar.");
      return;
    }

    try {
      for (const ausencia of ausencias) {
        await guardarAusencias({
          nombre_enfermero: ausencia.nombre,
          fecha_inicio: ausencia.fechaInicio,
          fecha_fin: ausencia.fechaFin,
          motivo: ausencia.motivo,
        });
      }
      alert("Todas las ausencias han sido guardadas correctamente.");
      setAusencias([]);
      guardarAusenciasEnCookies([]);
      setMostrarBotonGuardar(false);
    } catch (error) {
      console.error("Error al guardar las ausencias:", error);
      alert("Hubo un error al guardar las ausencias.");
    }
  };

  const agregarJefesAlCalendario = (calendario: any[], jefeManana?: Enfermero, jefeTarde?: Enfermero) => {
    return calendario.map((dia) => {
      const [añoFecha, mesFecha, diaFecha] = dia.fecha.split("-").map(Number);
      const fecha = new Date(añoFecha, mesFecha - 1, diaFecha);
      const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });
  
      let mañana = dia.mañana.map((e: any) => e.nombre).join(", ");
      let tarde = dia.tarde.map((e: any) => e.nombre).join(", ");
      let noche = dia.noche.map((e: any) => e.nombre).join(", ");
  
      if (["lunes", "martes", "miércoles", "jueves", "viernes"].includes(diaSemana.toLowerCase())) {
        if (jefeManana) {
          mañana = `${jefeManana.nombre}, ${mañana}`;
        }
        if (jefeTarde) {
          tarde = `${jefeTarde.nombre}, ${tarde}`;
        }
      }
  
      return {
        ...dia,
        mañana: mañana.split(", ").filter(Boolean),
        tarde: tarde.split(", ").filter(Boolean),
        noche: noche.split(", ").filter(Boolean),
      };
    });
  };

  const handleGuardarCalendario = async () => {
    try {
      const jefeManana = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "M"));
      const jefeTarde = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "T"));
  
      const calendarioConJefes = agregarJefesAlCalendario(calendario, jefeManana, jefeTarde);
  
      await guardarCalendario({
        mes,
        año,
        calendario: calendarioConJefes,
      });
  
      alert("Calendario guardado correctamente.");
      setMostrarBotonGuardarCalendario(false);
    } catch (error) {
      console.error("Error al guardar el calendario:", error);
      alert("Hubo un error al guardar el calendario.");
    }
  };

  const descargarCalendarioExcel = () => {
    const jefeManana = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "M"));
    const jefeTarde = enfermeros.find((e) => e.rango === "Jefe" && e.preferencias.some((p) => convertirPreferencia(p) === "T"));
  
    const datos = calendario.map((dia) => {
      const [añoFecha, mesFecha, diaFecha] = dia.fecha.split("-").map(Number);
      const fecha = new Date(añoFecha, mesFecha - 1, diaFecha);
      const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });
  
      let mañana = dia.mañana.map((e: any) => e.nombre).join(", ");
      let tarde = dia.tarde.map((e: any) => e.nombre).join(", ");
      let noche = dia.noche.map((e: any) => e.nombre).join(", ");
  
      if (["lunes", "martes", "miércoles", "jueves", "viernes"].includes(diaSemana.toLowerCase())) {
        if (jefeManana) {
          mañana = `${jefeManana.nombre}, ${mañana}`;
        }
        if (jefeTarde) {
          tarde = `${jefeTarde.nombre}, ${tarde}`;
        }
      }
  
      return {
        Fecha: fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }),
        Mañana: mañana,
        Tarde: tarde,
        Noche: noche,
        "Días Trabajados": dia.mañana.concat(dia.tarde, dia.noche)
          .reduce((acc: Record<string, number>, e: Enfermero) => {
            acc[e.nombre] = (diasTrabajadosPorEnfermero.get(e.id) || 0);
            return acc;
          }, {})
      };
    });
  
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Calendario de Turnos");
    XLSX.writeFile(libro, `Calendario_Turnos_${mes}_${año}.xlsx`);
  };

  if (esAdmin === null) {
    return <div className="p-6 text-center">Verificando permisos...</div>;
  }

  return (
    <div className="p-6">
      <div className="relative mb-6">
        <Link
          href="/enfermeros"
          className="absolute left-0 top-0 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ← Volver a Enfermeros
        </Link>
        <h1 className="text-3xl font-bold text-blue-600 text-center">
          📅 Calendario de Turnos
        </h1>
      </div>

      <div className="mb-6 p-4 border rounded-lg shadow bg-gray-100">
        <h2 className="text-lg font-bold mb-2">📌 Gestionar Ausencias</h2>
        <select id="enfermero" className="p-2 border rounded-lg mr-2">
          {enfermeros.map((e) => (
            <option key={e.nombre} value={e.nombre}>
              {e.nombre} ({e.rango})
            </option>
          ))}
        </select>
        <input id="fechaInicio" type="date" className="p-2 border rounded-lg mr-2" />
        <input id="fechaFin" type="date" className="p-2 border rounded-lg mr-2" />
        <input
          id="motivo"
          type="text"
          placeholder="Motivo (opcional)"
          className="p-2 border rounded-lg mr-2"
        />
        <button
          onClick={() => {
            const nombre = (document.getElementById("enfermero") as HTMLSelectElement).value;
            const fechaInicio = (document.getElementById("fechaInicio") as HTMLInputElement).value;
            const fechaFin = (document.getElementById("fechaFin") as HTMLInputElement).value;
            const motivo = (document.getElementById("motivo") as HTMLInputElement).value;
            if (nombre && fechaInicio && fechaFin) {
              agregarAusencia(nombre, fechaInicio, fechaFin, motivo);
            }
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
        >
          ➕ Registrar Ausencia
        </button>
      </div>

      <div className="mb-6 p-4 border rounded-lg shadow bg-gray-100">
        <h2 className="text-lg font-bold mb-2">📋 Ausencias Registradas</h2>
        <ul>
          {ausencias.map((ausencia, index) => (
            <li key={index} className="mb-2">
              <strong>{ausencia.nombre}</strong>: {ausencia.fechaInicio} a {ausencia.fechaFin} - Motivo: {ausencia.motivo}
              <button
                onClick={() => eliminarAusencia(index)}
                className="bg-red-500 text-white px-2 py-1 rounded-lg ml-2"
              >
                🗑️ Eliminar
              </button>
            </li>
          ))}
        </ul>
        {mostrarBotonGuardar && (
          <button
            onClick={handleGuardarTodasAusencias}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
          >
            💾 Guardar Todas las Ausencias
          </button>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="p-2 border rounded-lg"
        >
          {[...Array(12)].map((_, index) => (
            <option key={index} value={index + 1}>
              {new Date(2025, index).toLocaleString("es-ES", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={año}
          onChange={(e) => setAño(parseInt(e.target.value))}
          className="p-2 border rounded-lg"
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <button
          onClick={cargarTurnos}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          🔄 Generar Turnos
        </button>
        <button
          onClick={descargarCalendarioExcel}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
        >
          📥 Descargar Calendario (Excel)
        </button>
        {mostrarBotonGuardarCalendario && (
          <button
            onClick={handleGuardarCalendario}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition"
          >
            💾 Guardar Calendario
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-lg font-semibold">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calendario.map((dia) => {
            const [año, mes, diaNum] = dia.fecha.split("-").map(Number);
            const fecha = new Date(año, mes - 1, diaNum);

            return (
              <div key={dia.fecha} className="border p-4 rounded-lg shadow-md bg-white">
                <h2 className="text-lg font-bold text-blue-500">
                  {fecha.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                  })}
                </h2>
                <TurnoCard 
                  titulo="🌞 Mañana" 
                  enfermeros={dia.mañana} 
                  diasTrabajados={diasTrabajadosPorEnfermero} 
                />
                <TurnoCard 
                  titulo="🌆 Tarde" 
                  enfermeros={dia.tarde} 
                  diasTrabajados={diasTrabajadosPorEnfermero} 
                />
                <TurnoCard 
                  titulo="🌙 Noche" 
                  enfermeros={dia.noche} 
                  diasTrabajados={diasTrabajadosPorEnfermero} 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TurnoCard = ({ 
  titulo, 
  enfermeros,
  diasTrabajados 
}: { 
  titulo: string, 
  enfermeros: Enfermero[],
  diasTrabajados: Map<number, number>
}) => {
  // Calcular total de días trabajados para este turno
  const totalDiasTurno = enfermeros.reduce((sum, e) => sum + (diasTrabajados.get(e.id) || 0), 0);

  return (
    <div className="border rounded-lg p-3 mt-2">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-bold">{titulo}</h3>
        <span className="text-sm text-gray-600">Total días: {totalDiasTurno}</span>
      </div>
      <ul className="mt-2">
        {enfermeros.map((enfermero) => (
          <li key={enfermero.id} className="flex justify-between">
            <span>
              {enfermero.nombre} ({enfermero.rango})
            </span>
            <span className="font-semibold">
              {diasTrabajados.get(enfermero.id) || 0} días
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Calendario;
