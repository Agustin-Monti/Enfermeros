import { signUpAction } from "@/actions/auth-actions/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default function Signup({/*{ searchParams }: { searchParams: Message }*/}) {
  //if ("message" in searchParams) {
  //  return (
  //    <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
  //      <FormMessage message={searchParams} />
  //    </div>
  //  );
  //}
  return (
    <>
      <form className="flex flex-col mx-auto my-auto justify-center p-6 w-[80vw] md:w-[30vw] border-slate-950 border-2 rounded-md">
        <h1 className="text-3xl font-semibold text-center mb-6">Registrarse</h1>
        <p className="text-sm text text-foreground">
          Ya tiene una cuenta?{" "}
          <Link className="text-blue-600 font-medium underline" href="/sign-in">
            Log in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input 
          className="mt-1 block w-full rounded-md border-slate-950 border-b-2"
          name="email" placeholder="you@example.com" required />
          <Label htmlFor="password">Password</Label>
          <Input
            className="mt-1 block w-full rounded-md border-slate-950 border-b-2"
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <SubmitButton className="bg-blue-500 text-white text-center mt-2 p-2 rounded-lg hover:bg-blue-600" formAction={signUpAction} pendingText="Signing up...">
            Registrarse
          </SubmitButton>
          {/*<FormMessage message={searchParams} />*/}
        </div>
      </form>
    </>
  );
}
