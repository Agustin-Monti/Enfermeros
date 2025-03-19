"use client"; // Esto marca el archivo como un componente de cliente

import { useState, useEffect } from "react";
import { fetchProfile } from "@/actions/profile-actions"; // Lógica de obtención de perfil
import DatosGenerales from "@/components/DatosGenerales";
import { createClient } from "@/utils/supabase/client"; // Importa el cliente de Supabase
import Seguridad from "@/components/Seguridad";
import DemandaUsuario from "@/components/DemandaUsuario";

interface Profile {
  nombre: string;
  apellido: string;
  provincia: string;
  municipio: string;
  localidad: string;
  direccion: string;
  codigo_postal: string;
  fecha_creacion: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("datosGenerales");
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Estado para almacenar el usuario

  useEffect(() => {
    // Obtener la sesión de usuario cuando el componente se monta
    const fetchUserSession = async () => {
      const supabase = createClient(); // Crear cliente de Supabase

      const { data, error } = await supabase.auth.getSession(); // Obtener la sesión

      if (error) {
        console.error("Error al obtener sesión:", error.message);
      }

      if (data?.session?.user) {
        setUser(data.session.user); // Establecer el usuario si la sesión es válida
      } else {
        console.error("No se encontró un usuario autenticado.");
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    // Si hay un usuario, obtener el perfil
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const data = await fetchProfile(user.id); // Obtener el perfil con el ID de usuario
          setProfileData(data); // Establecer los datos del perfil
        } catch (err: any) {
          console.error("Error al obtener perfil:", err.message);
        } finally {
          setLoading(false); // Dejar de cargar
        }
      }
    };

    if (user) {
      fetchUserProfile(); // Si hay un usuario autenticado, obtener el perfil
    }
  }, [user]); // Solo se vuelve a ejecutar si 'user' cambia

  if (loading) return <div>Cargando perfil...</div>; // Cargar mientras se obtiene la información

  return (
    <main className="">
      <div className="flex flex-col md:flex-row items-center md:items-start">
        <aside className="w-[85vw] md:w-1/5 p-4 md:shadow-md">
          <h2 className="hidden md:flex font-bold text-xl text-blue-600 mb-4">Configuración de Perfil</h2>
          <ul className="flex flex-row md:flex-col gap-2">
            <li
              className={`py-2 cursor-pointer flex flex-row h-[48px] items-center justify-center mx-auto text-center lg-rounded gap-2 rounded-md p-3 text-sm ${
                activeTab === "datosGenerales" ? "bg-sky-100 text-blue-600" : "hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
              }`}
              onClick={() => setActiveTab("datosGenerales")}
            >

            <svg className={` ${activeTab === "datosGenerales" ? "text-blue-600" : "hover:text-blue-600"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill={"none"}>
              <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>

              <p className="hidden md:flex">Datos Generales</p>
            </li>
            <li
              className={`py-2 cursor-pointer flex flex-row justify-center mx-auto text-center flex h-[48px] items-center lg-rounded gap-2 rounded-md p-3 text-sm ${
                activeTab === "seguridad" ? "bg-sky-100 text-blue-600" : "hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
              }`}
              onClick={() => setActiveTab("seguridad")}
            >

            <svg className={` ${activeTab === "seguridad" ? "text-blue-600" : "hover:text-blue-600"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M12 16.5V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M4.2678 18.8447C4.49268 20.515 5.87612 21.8235 7.55965 21.9009C8.97626 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.8789 17.7547 20 16.6376 20 15.5C20 14.3624 19.8789 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97626 9.03397 7.55965 9.09909C5.87612 9.17649 4.49268 10.485 4.2678 12.1553C4.12104 13.2453 3.99999 14.3624 3.99999 15.5C3.99999 16.6376 4.12104 17.7547 4.2678 18.8447Z" stroke="currentColor" stroke-width="1.5" />
                <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            
            <p className="hidden md:flex">Seguridad</p>
            </li>
            <li
              className={`py-2 cursor-pointer flex flex-row justify-center mx-auto text-center flex h-[48px] items-center lg-rounded gap-2 rounded-md p-3 text-sm ${
                activeTab === "demandas" ? "bg-sky-100 text-blue-600" : "hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
              }`}
              onClick={() => setActiveTab("demandas")}
            >
            <svg className={` ${activeTab === "demandas" ? "text-blue-600" : "hover:text-blue-600"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" stroke-width="1.5" />
                <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
              <p className="hidden md:flex">Demandas</p>
            </li>
        </ul>
        </aside>
        <div className="w-[85vw] md:w-4/5 p-4">
          {activeTab === "datosGenerales" && (
              loading ? (
                <div>Cargando datos del perfil...</div>
              ) : profileData ? (
                <DatosGenerales data={profileData} />
              ) : (
                <div>No se encontraron datos del perfil.</div>
              )
          )}

          {activeTab === "seguridad" && (
            loading ? <div>Cargando seguridad...</div> : <Seguridad />
          )}
          {activeTab === "demandas" && (
            loading ? <div>Cargando demandas...</div> : <DemandaUsuario userId={user.id} />
          )}
        </div>
      </div>
    </main>
  );
}

