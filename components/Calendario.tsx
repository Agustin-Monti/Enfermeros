import { useState, useEffect } from "react";
import { generarTurnos, Enfermero, Dia } from "@/utils/generarTurnos";

const enfermeros: Enfermero[] = [
  { id: 1, nombre: "Juan", titular: true, preferencias: ["M", "T"], vacaciones: [], franco: [] },
  { id: 2, nombre: "María", titular: true, preferencias: ["T", "N"], vacaciones: ["2024-03-10"], franco: ["2024-03-15"] },
  { id: 3, nombre: "Carlos", titular: true, preferencias: ["M"], vacaciones: [], franco: [] },
  { id: 4, nombre: "Ana", titular: false, preferencias: ["N"], vacaciones: [], franco: ["2024-03-12"] },
  { id: 5, nombre: "Luis", titular: false, preferencias: ["M", "T"], vacaciones: [], franco: [] }
];

const Calendario = () => {
    const [calendario, setCalendario] = useState<Dia[]>([]);

  useEffect(() => {
    setCalendario(generarTurnos(enfermeros, 3, 2024));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Calendario de Turnos</h1>
      {calendario.map((dia) => (
        <div key={dia.fecha} className="border p-2 mb-2">
          <h2 className="font-bold">{dia.fecha}</h2>
          <p><strong>Mañana:</strong> {dia.mañana.map(e => e.nombre).join(", ")}</p>
          <p><strong>Tarde:</strong> {dia.tarde.map(e => e.nombre).join(", ")}</p>
          <p><strong>Noche:</strong> {dia.noche.map(e => e.nombre).join(", ")}</p>
        </div>
      ))}
    </div>
  );
};

export default Calendario;
