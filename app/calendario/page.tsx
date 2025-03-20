"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generarTurnos, Dia, Enfermero } from "@/utils/generarTurnos";
import { getEnfermerosTurnos, guardarAusencias, guardarCalendario } from "@/actions/enfermero-actions";
import * as XLSX from "xlsx";
import Link from "next/link";
import { verificarAdmin } from "@/actions/auth-actions/actions";
import { getCookie, setCookie } from "cookies-next"; // Importar funciones de cookies-next

interface Ausencia {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}

const isClient = () => typeof window !== "undefined";

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
  const [ausencias, setAusencias] = useState<Ausencia[]>([]); // Nuevo estado para las ausencias
  const router = useRouter();

  // Verificar si el usuario es admin
  useEffect(() => {
    const verificarAcceso = async () => {
      const admin = await verificarAdmin();
      if (!admin) {
        router.push("/"); // Redirigir al login si no es admin
      } else {
        setEsAdmin(true);
      }
    };
    verificarAcceso();
  }, [router]);

  // Cargar datos iniciales (enfermeros y ausencias)
  useEffect(() => {
    cargarEnfermeros();
    cargarAusenciasDesdeCookies(); // Esto solo se ejecutará en el cliente
  }, []);

  // Cargar ausencias desde las cookies
  const cargarAusenciasDesdeCookies = () => {
    const ausenciasGuardadas = JSON.parse(getCookie("ausencias") as string || "[]");
    setAusencias(ausenciasGuardadas); // Guardar en el estado
    if (ausenciasGuardadas.length > 0) {
      ausenciasGuardadas.forEach((ausencia: Ausencia) => {
        agregarAusencia(ausencia.nombre, ausencia.fechaInicio, ausencia.fechaFin, ausencia.motivo);
      });
      setMostrarBotonGuardar(true);
    }
  };

  // Guardar ausencias en las cookies
  const guardarAusenciasEnCookies = (ausencias: Ausencia[]) => {
    setCookie("ausencias", JSON.stringify(ausencias));
  };

  // Actualizar el calendario cuando cambien las ausencias
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
          mañana: reemplazarEnfermero([...dia.mañana], fechaStr),
          tarde: reemplazarEnfermero([...dia.tarde], fechaStr),
          noche: reemplazarEnfermero([...dia.noche], fechaStr),
        };
      });

      // Verificar si hay cambios antes de actualizar
      return JSON.stringify(prevCalendario) === JSON.stringify(calendarioActualizado)
        ? prevCalendario
        : calendarioActualizado;
    });
  }, [enfermerosAusentes, enfermerosFindesLibres]);

  const cargarEnfermeros = async () => {
    setLoading(true);
    try {
      const data = await getEnfermerosTurnos();
      setEnfermeros(data);
    } catch (error) {
      console.error("Error al cargar enfermeros:", error);
    }
    setLoading(false);
  };

  const cargarTurnos = () => {
    setLoading(true);
    const turnosGenerados = generarTurnos(enfermeros, mes, año);
    setCalendario(turnosGenerados);
    setMostrarBotonGuardarCalendario(true);
    setLoading(false);
  };

  const reemplazarEnfermero = (turno: Enfermero[], fecha: string): Enfermero[] => {
    const ausentes = enfermerosAusentes[fecha] || [];
    const findesLibres = enfermerosFindesLibres[fecha] || [];
    const enfermerosNoDisponibles = [...ausentes, ...findesLibres];

    return turno.map((enfermero) => {
      if (enfermerosNoDisponibles.includes(enfermero.nombre)) {
        const suplente = enfermeros.find(
          (e) => e.rango === "Suplente" && !turno.includes(e) && !enfermerosNoDisponibles.includes(e.nombre)
        );
        return suplente || enfermero;
      }
      return enfermero;
    });
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

      // Guardar la ausencia en las cookies
      const nuevaAusencia: Ausencia = { nombre, fechaInicio, fechaFin, motivo };
      const nuevasAusencias = [...ausencias, nuevaAusencia];
      setAusencias(nuevasAusencias);
      guardarAusenciasEnCookies(nuevasAusencias);

      console.log(`Ausencia registrada para ${nombre} desde ${fechaInicio} hasta ${fechaFin}. Motivo: ${motivo}`);
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
      setAusencias([]); // Limpiar el estado
      guardarAusenciasEnCookies([]); // Limpiar las cookies
      setMostrarBotonGuardar(false); // Ocultar el botón después de guardar
    } catch (error) {
      console.error("Error al guardar las ausencias:", error);
      alert("Hubo un error al guardar las ausencias.");
    }
  };

  // Función para guardar el calendario en la base de datos
  const handleGuardarCalendario = async () => {
    try {
      await guardarCalendario({
        mes,
        año,
        calendario: calendario, // Envía el calendario en formato JSON
      });
      alert("Calendario guardado correctamente.");
      setMostrarBotonGuardarCalendario(false); // Ocultar el botón después de guardar
    } catch (error) {
      console.error("Error al guardar el calendario:", error);
      alert("Hubo un error al guardar el calendario.");
    }
  };

  

  const descargarCalendarioExcel = () => {
    const datos = calendario.map((dia) => {
      const fecha = new Date(dia.fecha);
      return {
        Fecha: fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }),
        Mañana: dia.mañana.map((e) => e.nombre).join(", "),
        Tarde: dia.tarde.map((e) => e.nombre).join(", "),
        Noche: dia.noche.map((e) => e.nombre).join(", "),
      };
    });

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Calendario de Turnos");
    XLSX.writeFile(libro, `Calendario_Turnos_${mes}_${año}.xlsx`);
  };

  return (
    <div className="p-6">
      {/* Contenedor del título y el enlace */}
      <div className="relative mb-6">
        {/* Enlace "Volver a Enfermeros" */}
        <Link
          href="/enfermeros"
          className="absolute left-0 top-0 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ← Volver a Enfermeros
        </Link>

        {/* Título centrado */}
        <h1 className="text-3xl font-bold text-blue-600 text-center">
          📅 Calendario de Turnos
        </h1>
      </div>

      {/* Formulario para agregar ausencias */}
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

      {/* Mostrar ausencias registradas */}
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
        {/* Botón de guardar todas las ausencias */}
        {mostrarBotonGuardar && (
          <button
            onClick={handleGuardarTodasAusencias}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
          >
            💾 Guardar Todas las Ausencias
          </button>
        )}
      </div>

      {/* Selección de mes y año */}
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
        {/* Botón de guardar calendario */}
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
                <TurnoCard titulo="🌞 Mañana" enfermeros={dia.mañana} />
                <TurnoCard titulo="🌆 Tarde" enfermeros={dia.tarde} />
                <TurnoCard titulo="🌙 Noche" enfermeros={dia.noche} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TurnoCard = ({ titulo, enfermeros }: { titulo: string; enfermeros: Enfermero[] }) => (
  <div className="border rounded-lg p-3 mt-2">
    <h3 className="text-md font-bold">{titulo}</h3>
    <ul>
      {enfermeros.map((enfermero) => (
        <li key={enfermero.nombre}>
          {enfermero.nombre} ({enfermero.rango})
        </li>
      ))}
    </ul>
  </div>
);

export default Calendario;
