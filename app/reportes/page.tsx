"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerCalendarios, Calendario  } from "@/actions/reportes-actions";
import Sidebar from "@/components/Sidebar";
import ModalCalendario from "@/components/ModalCalendario";
import * as XLSX from "xlsx";
import { verificarAdmin } from "@/actions/auth-actions/actions";



const Reportes = () => {
  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [calendarioSeleccionado, setCalendarioSeleccionado] = useState<Calendario | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  // ✅ 1️⃣ Verificar si el usuario es admin
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

  useEffect(() => {
    const cargarCalendarios = async () => {
      try {
        const data = await obtenerCalendarios();
        setCalendarios(data);
      } catch (error) {
        console.error("Error al cargar calendarios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarCalendarios();
  }, []);

  const abrirModal = (calendario: Calendario) => {
    setCalendarioSeleccionado(calendario);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCalendarioSeleccionado(null);
  };


  const descargarCalendarioExcel = (calendario: any[], mes: number, año: number) => {
    const datos = calendario.map((dia) => {
      const [añoFecha, mesFecha, diaFecha] = dia.fecha.split("-").map(Number);
      const fecha = new Date(añoFecha, mesFecha - 1, diaFecha);
  
  
      return {
        Fecha: fecha.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
        }),
        Mañana: dia.mañana.map((e: any) => e.nombre).join(", "),
        Tarde: dia.tarde.map((e: any) => e.nombre).join(", "),
        Noche: dia.noche.map((e: any) => e.nombre).join(", "),
      };
    });
  
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Calendario de Turnos");
    XLSX.writeFile(libro, `Calendario_Turnos_${mes}_${año}.xlsx`);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 ml-64 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">📊 Reportes</h1>

        {loading ? (
          <p className="text-center text-lg font-semibold">Cargando...</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Mes</th>
                  <th className="border p-2">Año</th>
                  <th className="border p-2">Fecha de Creación</th>
                  <th className="border p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {calendarios.map((calendario) => (
                  <tr key={calendario.id} className="text-center">
                    <td className="border p-2">{calendario.mes}</td>
                    <td className="border p-2">{calendario.año}</td>
                    <td className="border p-2">
                      {new Date(calendario.fecha_creacion).toLocaleDateString("es-ES")}
                    </td>
                    <td className="border p-1">
                      <button
                        onClick={() => abrirModal(calendario)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Ver Detalles
                      </button>
                      {/* Botón para descargar en Excel */}
                      <button
                        onClick={() =>
                          descargarCalendarioExcel(
                            calendario.calendario,
                            calendario.mes,
                            calendario.año
                          )
                        }
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition ml-2"
                      >
                        Descargar Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalAbierto && calendarioSeleccionado && (
          <ModalCalendario calendario={calendarioSeleccionado} onClose={cerrarModal} />
        )}
      </div>
    </div>
  );
};

export default Reportes;
