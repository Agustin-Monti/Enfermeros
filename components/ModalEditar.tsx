import { useState, useEffect } from "react";
import { getEnfermeroById, updateEnfermero } from "@/actions/enfermero-actions";

interface ModalEditarProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  enfermeroId: string | null;
}

const ModalEditar = ({ isOpen, onClose, onRefresh, enfermeroId }: ModalEditarProps) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rango: "Titular",
    preferencias: [] as string[],
    francos: 0,
    vacaciones: 0,
  });

  // Cargar los datos del enfermero cuando el modal se abre
  useEffect(() => {
    if (isOpen && enfermeroId) {
      const cargarDatosEnfermero = async () => {
        try {
          const enfermero = await getEnfermeroById(enfermeroId);
          setFormData({
            nombre: enfermero.nombre,
            apellido: enfermero.apellido,
            rango: enfermero.rango,
            preferencias: enfermero.preferencias,
            francos: enfermero.francos,
            vacaciones: enfermero.vacaciones,
          });
        } catch (error) {
          console.error("Error al cargar los datos del enfermero:", error);
        }
      };
      cargarDatosEnfermero();
    }
  }, [isOpen, enfermeroId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePreferencias = (turno: string) => {
    setFormData((prev) => ({
      ...prev,
      preferencias: prev.preferencias.includes(turno)
        ? prev.preferencias.filter((p) => p !== turno)
        : [...prev.preferencias, turno],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enfermeroId) {
      try {
        await updateEnfermero(enfermeroId, formData);
        onRefresh(); // Refrescar la lista de enfermeros
        onClose(); // Cerrar el modal
      } catch (error) {
        console.error("Error al actualizar el enfermero:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Editar Enfermero</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="nombre"
            type="text"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="apellido"
            type="text"
            placeholder="Apellido"
            value={formData.apellido}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />
          <select
            name="rango"
            value={formData.rango}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          >
            <option value="Jefe">Jefe</option>
            <option value="Titular">Titular</option>
            <option value="Suplente">Suplente</option>
          </select>

          <div className="mb-2">
            <label>
              <input
                type="checkbox"
                checked={formData.preferencias.includes("Mañana")}
                onChange={() => handlePreferencias("Mañana")}
              />{" "}
              Mañana
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferencias.includes("Tarde")}
                onChange={() => handlePreferencias("Tarde")}
              />{" "}
              Tarde
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferencias.includes("Noche")}
                onChange={() => handlePreferencias("Noche")}
              />{" "}
              Noche
            </label>
          </div>

          <input
            name="francos"
            type="number"
            placeholder="Francos"
            value={formData.francos}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="vacaciones"
            type="number"
            placeholder="Vacaciones"
            value={formData.vacaciones}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />

          <button type="submit" className="bg-blue-500 text-white p-2 w-full">
            Guardar Cambios
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white p-2 w-full mt-2"
          >
            Cerrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalEditar;