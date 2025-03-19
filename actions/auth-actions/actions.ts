"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { headers as getHeaders } from 'next/headers';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  // Utiliza await para esperar que se resuelva la promesa de headers()
  const headersResolved = await headers();
  
  // Ahora puedes acceder al encabezado 'origin'
  const origin = headersResolved.get("origin");

  const callbackUrl = formData.get("callbackUrl")?.toString();


  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    // Redirect con confirmation email
    // return encodedRedirect(
    //   "success",
    //   "/sign-up",
    //   "Thanks for signing up! Please check your email for a verification link.",
    // );
    return encodedRedirect(
        "success",
        "/update-profile",
        "",
      );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Iniciar sesión
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return encodedRedirect("error", "/sign-in", authError.message);
  }

  // Verificar si el usuario es admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rango")
    .eq("id", user?.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut(); // Cerrar sesión si no se puede obtener el perfil
    return encodedRedirect("error", "/sign-in", "No se pudo obtener el perfil del usuario.");
  }

  if (profile.rango !== "admin") {
    await supabase.auth.signOut(); // Cerrar sesión si no es admin
    return encodedRedirect("error", "/sign-in", "Solo los administradores pueden iniciar sesión.");
  }

  // Redirigir al dashboard si es admin
  return redirect("/enfermeros");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const headers = await getHeaders(); // Await to resolve the promise 
  const origin = headers.get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};


export const verificarAdmin = async () => {

  const supabase = await createClient();

  // Obtener el usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return false; // No hay usuario autenticado
  }

  // Obtener el perfil del usuario desde la tabla `profiles`
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rango")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return false; // No se pudo obtener el perfil
  }

  // Verificar si el usuario tiene el rango de admin
  return profile.rango === "admin";
};
