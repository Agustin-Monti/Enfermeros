"use client";

import { Enfermero } from "@/utils/generarTurnos";

interface EnfermeroSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  enfermerosDisponibles: Enfermero[];
  onSelect: (enfermero: Enfermero) => void;
  titulo: string;
  diasTrabajadosPorEnfermero: Map<number, number>;
}

export const EnfermeroSelectorModal = ({
  isOpen,
  onClose,
  enfermerosDisponibles,
  onSelect,
  titulo,
  diasTrabajadosPorEnfermero
}: EnfermeroSelectorModalProps) => {
  if (!isOpen) return null;

  // Filtramos enfermeros que no sean jefes y que no hayan alcanzado su límite
  const enfermerosFiltrados = enfermerosDisponibles.filter(e => {
    const diasTrabajados = diasTrabajadosPorEnfermero.get(e.id) || 0;
    const esSuplenteOTitular = e.rango === "Suplente" || e.rango === "Titular";
    return esSuplenteOTitular && diasTrabajados < (e.rango === "Titular" ? 17 : 12);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-bold mb-4">Seleccionar enfermero para {titulo}</h3>
        <div className="overflow-y-auto flex-1">
          {enfermerosFiltrados.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay enfermeros disponibles</p>
          ) : (
            <ul>
              {enfermerosFiltrados.map((enfermero) => (
                <li 
                  key={enfermero.id} 
                  className="p-3 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    onSelect(enfermero);
                    onClose();
                  }}
                >
                  <div>
                    <p className="font-medium">{enfermero.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {enfermero.rango} - Días: {diasTrabajadosPorEnfermero.get(enfermero.id) || 0}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    enfermero.rango === "Titular" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                  }`}>
                    {enfermero.rango}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 self-end"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};