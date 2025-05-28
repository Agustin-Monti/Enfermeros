"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { generarTurnos, Dia, Enfermero, convertirPreferencia } from "@/utils/generarTurnos";
import { getEnfermerosTurnos, guardarAusencias, guardarCalendario } from "@/actions/enfermero-actions";
import * as XLSX from "xlsx";
import Link from "next/link";
import { verificarAdmin } from "@/actions/auth-actions/actions";
import { getCookie, setCookie } from "cookies-next";
import { EnfermeroSelectorModal } from "@/components/EnfermeroSelectorModal";

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
  const [enfermerosTemporales, setEnfermerosTemporales] = useState<Enfermero[]>([]);
  const [turnoParaAgregar, setTurnoParaAgregar] = useState<{
    fecha: string;
    turno: "mañana" | "tarde" | "noche";
  } | null>(null);
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
      
      const nuevosDiasTrabajados = new Map<number, number>();
      data.forEach(e => nuevosDiasTrabajados.set(e.id, 0));
      setDiasTrabajadosPorEnfermero(nuevosDiasTrabajados);
    } catch (error) {
      console.error("Error al cargar enfermeros:", error);
    }
    setLoading(false);
  };

  const cargarTurnos = () => {
    setLoading(true);
    try {
      const todosEnfermeros = [...enfermeros, ...enfermerosTemporales];
      const { calendario: turnosGenerados, diasTrabajados } = generarTurnos(
        todosEnfermeros, 
        mes, 
        año,
        enfermerosAusentes
      );
      
      setDiasTrabajadosPorEnfermero(diasTrabajados);
      setCalendario(turnosGenerados);
      setMostrarBotonGuardarCalendario(true);
    } catch (error) {
      console.error("Error al generar turnos:", error);
      alert("Hubo un error al generar los turnos.");
    }
    setLoading(false);
  };

  const actualizarDiasTrabajadosPorAusencia = (
    enfermeroAusente: Enfermero,
    fechaInicio: string,
    fechaFin: string,
    suplente?: Enfermero
  ) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const nuevosDiasTrabajados = new Map(diasTrabajadosPorEnfermero);
    
    let diasAusencia = 0;
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAusencia++;
      }
    }

    const diasActualesAusente = nuevosDiasTrabajados.get(enfermeroAusente.id) || 0;
    nuevosDiasTrabajados.set(
      enfermeroAusente.id, 
      Math.max(0, diasActualesAusente - diasAusencia)
    );

    if (suplente) {
      const diasActualesSuplente = nuevosDiasTrabajados.get(suplente.id) || 0;
      nuevosDiasTrabajados.set(suplente.id, diasActualesSuplente + diasAusencia);
    }

    setDiasTrabajadosPorEnfermero(nuevosDiasTrabajados);
  };

  const agregarAusencia = (nombre: string, fechaInicio: string, fechaFin: string, motivo: string) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const enfermeroAusente = enfermeros.find((e) => e.nombre === nombre);

    if (enfermeroAusente) {
      const fechasAusencia: string[] = [];
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        fechasAusencia.push(d.toISOString().split("T")[0]);
      }

      const primerDia = fechasAusencia[0];
      const turnoPrimerDia = calendario.find(d => d.fecha === primerDia)?.mañana || [];
      const suplente = encontrarSuplenteAdecuado(turnoPrimerDia, [nombre], primerDia);

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

  const agregarJefesAlCalendario = (calendario: Dia[], jefeManana?: Enfermero, jefeTarde?: Enfermero) => {
    return calendario.map((dia) => {
      const [añoFecha, mesFecha, diaFecha] = dia.fecha.split("-").map(Number);
      const fecha = new Date(añoFecha, mesFecha - 1, diaFecha);
      const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });

      const procesarTurno = (turno: Enfermero[], jefe?: Enfermero) => {
        const sinJefe = jefe ? turno.filter(e => e.id !== jefe.id) : turno;
        
        if (jefe && ["lunes", "martes", "miércoles", "jueves", "viernes"].includes(diaSemana.toLowerCase())) {
          return [jefe, ...sinJefe];
        }
        return [...sinJefe];
      };

      return {
        ...dia,
        mañana: procesarTurno(dia.mañana, jefeManana),
        tarde: procesarTurno(dia.tarde, jefeTarde),
        noche: dia.noche
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
  
      const obtenerNombresTurno = (turno: Enfermero[]) => {
        const nombres = turno.map(e => e.nombre);
        
        if (["lunes", "martes", "miércoles", "jueves", "viernes"].includes(diaSemana.toLowerCase())) {
          if (turno === dia.mañana && jefeManana && !nombres.includes(jefeManana.nombre)) {
            nombres.unshift(jefeManana.nombre);
          } else if (turno === dia.tarde && jefeTarde && !nombres.includes(jefeTarde.nombre)) {
            nombres.unshift(jefeTarde.nombre);
          }
        }
        
        return [...new Set(nombres)].join(", ");
      };
  
      return {
        Fecha: fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }),
        Mañana: obtenerNombresTurno(dia.mañana),
        Tarde: obtenerNombresTurno(dia.tarde),
        Noche: obtenerNombresTurno(dia.noche),
        "Días Trabajados": [...dia.mañana, ...dia.tarde, ...dia.noche]
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

  const agregarEnfermeroTemporal = () => {
    const nombre = prompt("Ingrese el nombre del enfermero temporal:");
    if (nombre && nombre.trim() !== "") {
      const nuevoEnfermero: Enfermero = {
        id: Date.now(),
        nombre: nombre.trim(),
        titular: false,
        preferencias: ["M", "T", "N"],
        rango: "Suplente",
        vacaciones: 0,
        franco: 0,
        diasTrabajadosObjetivo: 30,
        diasFranco: [],
        diasVacaciones: []
      };
      
      setEnfermerosTemporales([...enfermerosTemporales, nuevoEnfermero]);
      
      setDiasTrabajadosPorEnfermero(prev => {
        const nuevoMap = new Map(prev);
        nuevoMap.set(nuevoEnfermero.id, 0);
        return nuevoMap;
      });
      
      alert(`${nombre.trim()} ha sido añadido como suplente temporal.`);
    } else {
      alert("Debe ingresar un nombre válido.");
    }
  };

  const agregarEnfermeroATurno = (fecha: string, turno: "mañana" | "tarde" | "noche") => {
    setTurnoParaAgregar({ fecha, turno });
  };

  const seleccionarEnfermeroParaTurno = (enfermero: Enfermero) => {
    if (!turnoParaAgregar) return;

    setCalendario(prev => prev.map(dia => {
      if (dia.fecha === turnoParaAgregar.fecha) {
        return {
          ...dia,
          [turnoParaAgregar.turno]: [...dia[turnoParaAgregar.turno], enfermero]
        };
      }
      return dia;
    }));

    setDiasTrabajadosPorEnfermero(prev => {
      const nuevoMap = new Map(prev);
      const diasActuales = nuevoMap.get(enfermero.id) || 0;
      nuevoMap.set(enfermero.id, diasActuales + 1);
      return nuevoMap;
    });

    setTurnoParaAgregar(null);
  };

  const enfermerosDisponiblesParaTurno = useMemo(() => {
    return [...enfermeros, ...enfermerosTemporales].filter(
      e => e.rango === "Titular" || e.rango === "Suplente"
    );
  }, [enfermeros, enfermerosTemporales]);

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
        <button
          onClick={agregarEnfermeroTemporal}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition"
        >
          👨⚕️ Añadir Temporal
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
            const esFinde = dia.diaSemana === "Sábado" || dia.diaSemana === "Domingo";

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
                  onAgregarEnfermero={() => agregarEnfermeroATurno(dia.fecha, "mañana")}
                  cantidadEsperada={esFinde ? 3 : 4}
                  fecha={dia.fecha}
                />
                <TurnoCard 
                  titulo="🌆 Tarde" 
                  enfermeros={dia.tarde} 
                  diasTrabajados={diasTrabajadosPorEnfermero}
                  onAgregarEnfermero={() => agregarEnfermeroATurno(dia.fecha, "tarde")}
                  cantidadEsperada={esFinde ? 3 : 4}
                  fecha={dia.fecha}
                />
                <TurnoCard 
                  titulo="🌙 Noche" 
                  enfermeros={dia.noche} 
                  diasTrabajados={diasTrabajadosPorEnfermero}
                  onAgregarEnfermero={() => agregarEnfermeroATurno(dia.fecha, "noche")}
                  cantidadEsperada={2}
                  fecha={dia.fecha}
                />
              </div>
            );
          })}
        </div>
      )}

      {turnoParaAgregar && (
        <EnfermeroSelectorModal
          isOpen={!!turnoParaAgregar}
          onClose={() => setTurnoParaAgregar(null)}
          enfermerosDisponibles={enfermerosDisponiblesParaTurno}
          onSelect={seleccionarEnfermeroParaTurno}
          titulo={`${turnoParaAgregar.turno} - ${turnoParaAgregar.fecha}`}
          diasTrabajadosPorEnfermero={diasTrabajadosPorEnfermero} // Añade esta línea
        />
      )}
    </div>
  );
};

const TurnoCard = ({ 
  titulo, 
  enfermeros,
  diasTrabajados,
  onAgregarEnfermero,
  cantidadEsperada,
  fecha
}: { 
  titulo: string, 
  enfermeros: Enfermero[],
  diasTrabajados: Map<number, number>,
  onAgregarEnfermero: () => void,
  cantidadEsperada: number,
  fecha: string
}) => {
  const totalDiasTurno = enfermeros.reduce((sum, e) => sum + (diasTrabajados.get(e.id) || 0), 0);
  const necesitaMasEnfermeros = enfermeros.length < cantidadEsperada;
  const fechaObj = new Date(fecha);
  const diaSemana = fechaObj.toLocaleDateString("es-ES", { weekday: "long" });
  const esFinde = diaSemana === "Sábado" || diaSemana === "Domingo";

  // Separar enfermeros (jefes solo si no es fin de semana)
  const jefes = esFinde ? [] : enfermeros.filter(e => e.rango === "Jefe");
  const otrosEnfermeros = enfermeros.filter(e => e.rango !== "Jefe");

  return (
    <div className="border rounded-lg p-3 mt-2 relative">
      {necesitaMasEnfermeros && (
        <button
          onClick={onAgregarEnfermero}
          className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 transition-transform hover:scale-110"
          title="Añadir enfermero"
        >
          +
        </button>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-md font-bold">{titulo}</h3>
        <span className="text-sm text-gray-600">
          {enfermeros.length}/{cantidadEsperada} - Días: {totalDiasTurno}
        </span>
      </div>
      
      {jefes.length > 0 && (
        <div className="mt-2">
          <span className="text-xs font-semibold text-purple-600">JEFE:</span>
          <ul>
            {jefes.map(enfermero => (
              <li key={enfermero.id} className="flex justify-between">
                <span className="text-purple-600">{enfermero.nombre}</span>
                <span className="font-semibold text-purple-600">
                  {diasTrabajados.get(enfermero.id) || 0} días
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-1">
        <ul>
          {otrosEnfermeros.map(enfermero => (
            <li key={enfermero.id} className="flex justify-between">
              <span>
                {enfermero.nombre} 
                <span className="text-xs ml-1">
                  ({enfermero.rango}
                  {enfermero.id > 100000 && " temporal"})
                </span>
              </span>
              <span className="font-semibold">
                {diasTrabajados.get(enfermero.id) || 0} días
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Calendario;
