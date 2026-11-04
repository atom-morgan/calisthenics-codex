"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthFormState,
  loginSchema,
  signupSchema,
} from "@/lib/validation/auth";

// Server Actions are public endpoints: anyone can POST to them, so every input
// is validated here even though the form also has HTML validation.

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = { email: text(formData, "email"), password: text(formData, "password") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { email: raw.email },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Same message for "no such user" and "wrong password", so the form can't
    // be used to discover which emails have accounts.
    return {
      error: "Incorrect email or password.",
      values: { email: raw.email },
    };
  }

  // redirect() works by throwing, so it must stay outside any try/catch.
  redirect("/workouts");
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  };
  const values = { name: raw.name, email: raw.email };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Stored on auth.users; the DB trigger copies it into public.users.name.
    options: { data: { name } },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "An account with this email already exists.", values };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: [error.message] }, values };
    }
    console.error("signup failed", error.code, error.message);
    return { error: "Couldn't create your account. Please try again.", values };
  }

  // With email confirmation off (our setting), signUp also logs the user in.
  // If it's ever turned back on, there's no session until they click the link.
  if (!data.session) {
    return { error: "Check your email to confirm your account, then log in." };
  }

  redirect("/workouts");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
