import { useState } from "react";
import { addEnfermero } from "@/actions/enfermero-actions";

const AgregarEnfermero = ({ isOpen, onClose, onRefresh }: any) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rango: "Titular",
    preferencias: [] as string[],  // <-- Aquí definimos el tipo
    francos: 0,
    vacaciones: 0,
  });
  

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
    await addEnfermero(formData);
    onRefresh(); // Refrescar la lista de enfermeros
    onClose(); // Cerrar el modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Agregar Enfermero</h2>
        <form onSubmit={handleSubmit}>
          <input name="nombre" type="text" placeholder="Nombre" onChange={handleChange} className="border p-2 w-full mb-2" />
          <input name="apellido" type="text" placeholder="Apellido" onChange={handleChange} className="border p-2 w-full mb-2" />
          <select name="rango" onChange={handleChange} className="border p-2 w-full mb-2">
            <option value="Jefe">Jefe</option>
            <option value="Titular">Titular</option>
            <option value="Suplente">Suplente</option>
          </select>

          <div className="mb-2">
            <label><input type="checkbox" onChange={() => handlePreferencias("Mañana")} /> Mañana</label>
            <label><input type="checkbox" onChange={() => handlePreferencias("Tarde")} /> Tarde</label>
            <label><input type="checkbox" onChange={() => handlePreferencias("Noche")} /> Noche</label>
          </div>

          <input name="francos" type="number" placeholder="Francos" onChange={handleChange} className="border p-2 w-full mb-2" />
          <input name="vacaciones" type="number" placeholder="Vacaciones" onChange={handleChange} className="border p-2 w-full mb-2" />

          <button type="submit" className="bg-blue-500 text-white p-2 w-full">Agregar</button>
          <button type="button" onClick={onClose} className="bg-gray-500 text-white p-2 w-full mt-2">Cerrar</button>
        </form>
      </div>
    </div>
  );
};

export default AgregarEnfermero;
