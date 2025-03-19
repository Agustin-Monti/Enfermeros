"use client"; // Convertimos este componente en un cliente

import React, { useEffect, useState } from "react";
import { InfoIcon } from "lucide-react";

export default function UpdateProfilePage(){
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
