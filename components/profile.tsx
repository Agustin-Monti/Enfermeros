"use client";
import React from 'react'
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation"; // Para Next.js 13+
import Link from "next/link";
import { getAllDemandas, getUserDemandas } from "@/actions/demanda-actions";
import DemandasCliente from "@/components/DemandasCliente";
import { User as SupabaseUser } from "@supabase/auth-js";
import { PostgrestError } from "@supabase/postgrest-js";

type User = SupabaseUser & {
    name?: string; // Propiedad opcional
  };
  
  type Demanda = {
    id: number;
    descripcion: string;
    // otras propiedades
  };

const ProfileDash = async () => {
    const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState<PostgrestError | null>(null); // Acepta PostgrestError o null
  const [nombre, setNombre] = useState(""); // Estado para el nombre
  const [apellido, setApellido] = useState(""); // Estado para el apellido
  const [email, setEmail] = useState(""); // Estado para el apellido
  const [provincia, setProvincia] = useState(""); 
  const [municipio, setMunicipio] = useState(""); 
  const [localidad, setLocalidad] = useState(""); 
  const [direccion, setDireccion] = useState(""); 
  const [codigo_postal, setCodigo] = useState(""); 
  const [formattedDate, setFormattedDate] = useState(""); 
  const [activeTab, setActiveTab] = useState("datosGenerales"); // Estado para controlar la pestaña activa

  // State for storing demandas
  const [demandas, setDemandas] = useState<Demanda[]>([]); // Acepta un arreglo de objetos tipo 'Demanda'
  // Assuming demandas is an array

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error al obtener el usuario o el usuario no está autenticado:", userError);
        router.push("/sign-in");
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setProfileError(profileError);
        console.error("Error obteniendo el perfil:", profileError);
      } else {
        setProfile(profile);
        setNombre(profile?.nombre || "");
        setApellido(profile?.apellido || "");
        setEmail(profile?.email || "");
        setProvincia(profile?.provincia || ""); 
        setMunicipio(profile?.municipio || ""); 
        setLocalidad(profile?.localidad || ""); 
        setDireccion(profile?.direccion || ""); 
        setCodigo(profile?.codigo_postal || ""); 
        const formattedDate = profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : ""; 

        setFormattedDate(formattedDate);
      }
    };

    // Fetch user profile and demandas
    const fetchDemandas = async () => {
      try {
        // Call getAllDemandas or a similar API function to get all demandas
        const fetchedDemandas = await getUserDemandas (); // This should be an async function that fetches demandas
        setDemandas(fetchedDemandas); // Set fetched demandas into state
      } catch (error) {
        console.error("Error fetching demandas:", error);
      }
    };

    fetchUserProfile();
    fetchDemandas(); // Fetch demandas when the component mounts
  }, [supabase]);

  const handleDelete = async () =>{

  }

  const handleSave = async () => {
    if (!user) {
      console.error("Usuario no autenticado");
      return; // Salir de la función si el usuario es null
    }
  
    const { error } = await supabase
      .from("profile")
      .update({
        nombre,
        apellido,
        email,
        provincia,
        municipio,
        localidad,
        direccion,
        codigo_postal,
      })
      .eq("id", user.id); // Aquí 'user' ya no es null
  
    if (error) {
      console.error("Error al actualizar el perfil:", error);
    } else {
      alert("Perfil actualizado con éxito");
    }
  };

  return (
    
    <div>
        <div className="flex w-full min-h-screen">
            <aside className="w-1/3 p-4 shadow-md">
                <h2 className="font-bold text-xl mb-4">Configuracion de Perfil</h2>
                <ul className="flex flex-col">
                <li className="py-2 hover:bg-gray-200 hover:text-black cursor-pointer" onClick={() => setActiveTab("datosGenerales")}>Datos Generales</li>
                <li className="py-2 hover:bg-gray-200 hover:text-black cursor-pointer" onClick={() => setActiveTab("seguridad")}>Seguridad</li>
                <li className="py-2 hover:bg-gray-200 hover:text-black cursor-pointer" onClick={() => setActiveTab("demandas")}>Demandas</li>
                </ul>
            </aside>
        </div>
        <h4 className="font-bold text-3xl mb-6">Detalles de tu perfil</h4>
    {profileError && <div className="text-red-500 mb-4">Error obteniendo tu perfil: {profileError.message}</div>}

        {/* Form fields for profile */}
        {activeTab === "datosGenerales" && (
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Provincia</label>
          <input
            type="text"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Municipio</label>
          <input
            type="text"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Localidad</label>
          <input
            type="text"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Direccion</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Codigo Postal</label>
          <input
            type="text"
            value={codigo_postal}
            onChange={(e) => setCodigo(e.target.value)}
            className="border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex flex-col mb-1">
          <label className="block mb-2 font-semibold">Fecha de Creación</label>
          <p className="rounded-md p-3 shadow-sm">
            {formattedDate || "No disponible"}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="mt-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 transition"
        >
          Guardar Cambios
        </button>
      </div>
    )}

    {activeTab === "seguridad" && (
      <div className="p-4 rounded-md mb-6">
        {/* Seguridad form */}
        {activeTab === "seguridad" && (
      <div className="p-4 rounded-md mb-6">
        <h2 className="font-bold text-xl mb-4">Seguridad</h2>
        <div className="flex flex-col mb-6">
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly
            className="border border-gray-300 rounded-md p-3 cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col mb-6">
          <label className="block mb-2 font-semibold">Contraseña</label>
          <input
            type="password"
            placeholder="********"
            readOnly
            className="border border-gray-300 rounded-md p-3 cursor-not-allowed"
          />
          <button
            onClick={handleSave}
            className="mt-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 transition"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    )}
      </div>
    )}

    {activeTab === "demandas" && (
      <div>
        <h2 className="font-bold text-xl mb-4">Demandas</h2>
        {/* Verifica que tienes el userId y las categorias disponibles */}
        <DemandasCliente 
          demandas={demandas} 
          userId={user?.id ?? null} // Asegúrate de que user no sea null
          categorias={categorias.length ? categorias : []} // Asegúrate de tener las categorias disponibles
        />
        <div className="mt-4">
          <Link href={"demandas/new"} className="mt-4 bg-blue-400 text-white py-2 px-4 rounded hover:bg-blue-500 transition">Nueva Demanda</Link>
        </div>
      </div>
    )}</div>
  )
}

export default ProfileDash