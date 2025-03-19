"use client"; // Asegúrate de marcar este componente como "use client"

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { InfoIcon } from "lucide-react";

export default function ProtectedPage() {
  const [seconds, setSeconds] = useState(5);
  const supabase = createClient();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/sign-in");
      }
    };

    checkUser();

    // Temporizador para redirigir al usuario
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          redirect("/"); // Redirigir al usuario después de 5 segundos
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Limpiar el temporizador al desmontar el componente
  }, [supabase.auth]);

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
      {/* Mensaje de confirmación */}
      <div className="bg-green-100 text-green-700 text-sm p-6 rounded-md flex gap-3 items-center max-w-md">
        <InfoIcon size="20" strokeWidth={2} />
        <p>¡Tu cuenta se ha activado correctamente!</p>
      </div>

      {/* Temporizador circular */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Círculo de fondo */}
          <circle
            className="text-gray-200 stroke-current"
            strokeWidth="10"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
          />
          {/* Círculo de progreso */}
          <circle
            className="text-green-500 stroke-current"
            strokeWidth="10"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            strokeDasharray="251.2" // Circunferencia del círculo (2 * π * r)
            strokeDashoffset={`${251.2 - (seconds / 5) * 251.2}`} // Ajustar el progreso
            strokeLinecap="round"
          />
        </svg>
        {/* Contador de segundos */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-green-700">
          {seconds}
        </div>
      </div>

      {/* Mensaje de redirección */}
      <p className="text-gray-600">Serás redirigido en {seconds} segundos...</p>
    </div>
  );
}