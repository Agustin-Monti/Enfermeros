import { signOutAction } from "@/actions/auth-actions/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import {
  UserIcon,
} from "@heroicons/react/24/solid";

export default async function AuthButton() {
  // Check environment variables (ensure this is called async if needed)
  if (!hasEnvVars) {
    return (
      <div className="flex gap-4 items-center">
        <Badge variant={"default"} className="font-normal pointer-events-none">
          Please update .env.local file with anon key and url
        </Badge>
        <div className="flex gap-2">
          
          <Button
            asChild
            size="sm"
            variant={"outline"}
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-in">Iniciar Sesión</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={"default"}
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-up">Cerrar Sesión</Link>
          </Button>
          <li className="flex flex-col items-center cursor-pointer">
            
          </li>
        </div>
      </div>
    );
  }

  // Create Supabase client and get user data
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <Link className="ito" href="/profile">
              <UserIcon className="w-6 h-6 ito mx-auto" />          
              <p className="hidden md:flex">{user.email}</p>
      </Link>
      <form action={signOutAction}>
        
        <Button type="submit" variant={"outline"}>
          Cerrar Sesión
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Crear Cuenta</Link>
      </Button>
    </div>
  );
}

