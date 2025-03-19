import { forgotPasswordAction } from "@/actions/auth-actions/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default function ForgotPassword (){
  {/*{
  searchParams,
}: {
  searchParams: Message;
}) {*/}
  return (
    <>
      <form className="flex flex-col mx-auto my-auto justify-center p-6 w-[80vw] md:w-[30vw] border-slate-950 border-2 rounded-md">
        <div>
          <h1 className="text-2xl font-medium">Reset Password</h1>
          <p className="text-sm text-secondary-foreground">
            Ya tienes una cuenta?{" "}
            <Link className="text-primary underline" href="/sign-in">
              Iniciar Sesion
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <SubmitButton formAction={forgotPasswordAction}>
            Reset Password
          </SubmitButton>
          {/*<FormMessage message={searchParams} */}
        </div>
      </form>
    </>
  );
}
