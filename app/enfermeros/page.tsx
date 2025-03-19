"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEnfermeros, updateEnfermero, deleteEnfermero } from "@/actions/enfermero-actions";
import AgregarEnfermero from "@/components/AgregarEnfermero";
import ModalEditar from "@/components/ModalEditar";
import Sidebar from "@/components/Sidebar";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { verificarAdmin } from "@/actions/auth-actions/actions";

interface Enfermero {
  id: number;
  nombre: string;
  apellido: string;
  rango: string;
  preferencias: string[];
  francos: number;
  vacaciones: number;
}

const Enfermeros = () => {
  const [enfermeros, setEnfermeros] = useState<Enfermero[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [enfermeroEditando, setEnfermeroEditando] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    const data = await getEnfermeros();
    setEnfermeros(data);
  };

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

  if (esAdmin === null) {
    return <p>Cargando...</p>; // Mostrar un mensaje de carga mientras se verifica
  }

  if (!esAdmin) {
    return null; // No mostrar nada si no es admin (ya se redirigió)
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Función para manejar la edición de un enfermero
  const handleEdit = (id: string) => {
    setEnfermeroEditando(id);
    setModalEditarOpen(true);
  };

  // Función para manejar la eliminación de un enfermero
  const handleDelete = async (id: string) => {
    try {
      const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar este enfermero?");
      if (confirmacion) {
        await deleteEnfermero(id);
        console.log("Enfermero eliminado correctamente");
        fetchData(); // Refrescar la lista de enfermeros
      }
    } catch (error) {
      console.error("Error al eliminar el enfermero:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 p-6 bg-gray-100 ml-64"> {/* Agregar ml-64 para el margen izquierdo */}
        <h1 className="text-2xl font-bold mb-4">Gestión de Enfermeros</h1>
        <button onClick={() => setModalOpen(true)} className="bg-green-500 text-white p-2 mb-4 rounded-lg">
          ➕ Agregar Enfermero/ra
        </button>

        {/* Tabla de enfermeros */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-5">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Nombre</th>
                <th className="border p-2">Apellido</th>
                <th className="border p-2">Rango</th>
                <th className="border p-2">Turnos</th>
                <th className="border p-2">Francos</th>
                <th className="border p-2">Vacaciones</th>
                <th className="border p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enfermeros.map((e: any) => (
                <tr key={e.id} className="text-center">
                  <td className="border p-2">{e.nombre}</td>
                  <td className="border p-2">{e.apellido}</td>
                  <td className="border p-2">{e.rango}</td>
                  <td className="border p-2">{e.preferencias.join(", ")}</td>
                  <td className="border p-2">{e.francos}</td>
                  <td className="border p-2">{e.vacaciones}</td>
                  <td className="border p-2">
                    <div className="flex justify-center space-x-2">
                      {/* Botón de editar */}
                      <button
                        onClick={() => handleEdit(e.id)}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        <PencilIcon className="w-5 h-5"/>
                      </button>

                      {/* Botón de eliminar */}
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <br />
      </div>

      {/* Modal para agregar enfermero */}
      <AgregarEnfermero isOpen={modalOpen} onClose={() => setModalOpen(false)} onRefresh={fetchData} />

      {/* Modal para editar enfermero */}
      <ModalEditar
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        onRefresh={fetchData}
        enfermeroId={enfermeroEditando}
      /> 
    </div>
  );
};

export default Enfermeros;