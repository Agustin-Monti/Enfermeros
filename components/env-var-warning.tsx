import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <Badge variant={"outline"} className="font-normal">
        Supabase environment variables required
      </Badge>
      <div className="flex gap-2">
        <Button
          asChild
          size="sm"
          variant={"outline"}
          disabled
          className="opacity-75 cursor-none text-white bg-blue-500 pointer-events-none"
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
      </div>
    </div>
  );
}
