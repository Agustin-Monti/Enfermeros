"use client"; // Convertimos este componente en un cliente
import React, { useEffect, useState } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { InfoIcon } from "lucide-react";

export default function UpdateProfilePage(){
 {/*searchParams,
}: {
  searchParams: Message;
}) {*/} 
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    provincia: "",
    municipio: "",
    localidad: "",
    codigo_postal: "",
    direccion: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return (
          <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
            {error.message}
          </div>
        );
      }
      if (user) {
        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("*")
          .eq("id", user.id)
          .single(); // single() se usa para obtener un solo registro

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData || {});
        }
      }

      setLoading(false);
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  {/*if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }*/}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
        {/* Mensaje de confirmación */}
        <div className="bg-green-100 text-green-700 text-sm p-6 rounded-md flex gap-3 items-center max-w-md">
          <InfoIcon size="20" strokeWidth={2} />
          <p>¡Confirma tu cuenta con el mail de confirmacion que te enviamos.!</p>
        </div>
        <p className="bg-green-100 text-green-700 text-sm p-6 rounded-md flex gap-3 items-center max-w-md">Puedes cerrar esta pestaña</p>
      </div>
    </>
  );
}
