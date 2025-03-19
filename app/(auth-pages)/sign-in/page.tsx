// app/sign-in/page.tsx
import { signInAction } from "@/actions/auth-actions/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Login({ searchParams }: { searchParams: Message }) {
  return (
    <form className="flex flex-col mx-auto my-auto justify-center p-6 w-[80vw] md:w-[30vw] rounded-md">
      <h1 className="text-3xl font-semibold text-center mb-6">Iniciar Sesión</h1>

      {/* Mostrar mensaje de error */}
      <FormMessage message={searchParams} />

      <p className="text-sm text-gray-600 mb-4">
        No tiene cuenta?{" "}
        <Link className="text-blue-600 font-medium underline" href="/sign-up">
          Crear una Cuenta
        </Link>
      </p>

      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            className="mt-1 block w-full rounded-md border-slate-950 border-b-2"
            name="email"
            placeholder="correo@correo.com"
            required
          />
        </div>

        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña
          </Label>
          <Link
            className="text-xs text-blue-600 underline"
            href="/forgot-password"
          >
            Has olvidado su contraseña?
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            type="password"
            name="password"
            placeholder="Tú Contraseña"
            required
            className="mt-1 block w-full rounded-md border-slate-950 border-b-2"
          />
        </div>

        <SubmitButton
          className="bg-blue-500 text-white text-center mt-2 p-2 rounded-lg hover:bg-blue-600"
          pendingText="Accediendo..."
          formAction={signInAction}
        >
          Iniciar Sesión
        </SubmitButton>
      </div>
    </form>
  );
}