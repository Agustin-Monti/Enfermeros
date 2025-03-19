import { Calendario, EstadisticasEnfermero  } from "@/actions/reportes-actions"; // Asegúrate de importar la interfaz Calendario
import { calcularEstadisticas } from "@/actions/reportes-actions";
import { useEffect, useState } from "react";

interface ModalCalendarioProps {
  calendario: Calendario;
  onClose: () => void;
}

const ModalCalendario = ({ calendario, onClose }: ModalCalendarioProps) => {
  const calendarioParseado = calendario.calendario;
  const [estadisticas, setEstadisticas] = useState<EstadisticasEnfermero[]>([]);

  // Calcular estadísticas cuando el modal se abre
  useEffect(() => {
    const stats = calcularEstadisticas(calendarioParseado);
    setEstadisticas(stats);
  }, [calendarioParseado]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
        {/* Encabezado del modal */}
        <h2 className="text-xl font-bold mb-4">
          Detalles del Calendario ({calendario.mes}/{calendario.año})
        </h2>

        {/* Cuerpo del modal con scroll */}
        <div className="overflow-y-auto flex-1">
          {/* Mostrar el calendario */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(calendarioParseado) &&
              calendarioParseado.map((dia: any) => {
                const [año, mes, diaNum] = dia.fecha.split("-").map(Number);
                const fecha = new Date(año, mes - 1, diaNum);

                return (
                  <div
                    key={dia.fecha}
                    className="border p-4 rounded-lg shadow-md bg-white"
                  >
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

          {/* Mostrar estadísticas */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">📈 Estadísticas del Mes</h2>
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Enfermero</th>
                  <th className="border p-2">Días Trabajados</th>
                  <th className="border p-2">Días No Trabajados</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((estadistica, index) => (
                  <tr key={index} className="text-center">
                    <td className="border p-2">{estadistica.nombre}</td>
                    <td className="border p-2">{estadistica.diasTrabajados}</td>
                    <td className="border p-2">{estadistica.diasNoTrabajados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón para cerrar el modal */}
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg mt-4"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

const TurnoCard = ({ titulo, enfermeros }: { titulo: string; enfermeros: any[] }) => (
  <div className="border rounded-lg p-3 mt-2">
    <h3 className="text-md font-bold">{titulo}</h3>
    <ul>
      {Array.isArray(enfermeros) &&
        enfermeros.map((enfermero) => (
          <li key={enfermero.nombre}>
            {enfermero.nombre} ({enfermero.rango})
          </li>
        ))}
    </ul>
  </div>
);

export default ModalCalendario;