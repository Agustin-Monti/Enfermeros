// app/licencias/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerAusencias, Ausencia } from "@/actions/licencias-actions";
import Sidebar from "@/components/Sidebar";
import { verificarAdmin } from "@/actions/auth-actions/actions";

const Licencias = () => {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);
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
    const cargarAusencias = async () => {
      try {
        const data = await obtenerAusencias();
        setAusencias(data);
      } catch (error) {
        console.error("Error al cargar las ausencias:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarAusencias();
  }, []);

  // Función para agrupar las ausencias por mes
  const agruparPorMes = (ausencias: Ausencia[]) => {
    const agrupadas: { [mes: string]: Ausencia[] } = {};

    ausencias.forEach((ausencia) => {
      const fechaInicio = new Date(ausencia.fecha_inicio);
      const mes = fechaInicio.toLocaleString("es-ES", { month: "long", year: "numeric" });

      if (!agrupadas[mes]) {
        agrupadas[mes] = [];
      }
      agrupadas[mes].push(ausencia);
    });

    return agrupadas;
  };

  const ausenciasAgrupadas = agruparPorMes(ausencias);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 ml-64 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">📋 Licencias y Ausencias</h1>

        {loading ? (
          <p className="text-center text-lg font-semibold">Cargando...</p>
        ) : (
          Object.entries(ausenciasAgrupadas).map(([mes, ausencias]) => (
            <div key={mes} className="mb-8">
              <h2 className="text-xl font-bold mb-4">{mes}</h2>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Enfermero</th>
                      <th className="border p-2">Fecha de Inicio</th>
                      <th className="border p-2">Fecha de Fin</th>
                      <th className="border p-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ausencias.map((ausencia) => (
                      <tr key={ausencia.id} className="text-center">
                        <td className="border p-2">{ausencia.nombre_enfermero}</td>
                        <td className="border p-2">
                          {new Date(ausencia.fecha_inicio).toLocaleDateString("es-ES")}
                        </td>
                        <td className="border p-2">
                          {new Date(ausencia.fecha_fin).toLocaleDateString("es-ES")}
                        </td>
                        <td className="border p-2">{ausencia.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Licencias;
