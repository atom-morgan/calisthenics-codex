"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthFormState,
  loginSchema,
  signupSchema,
} from "@/lib/validation/auth";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    email: text(formData, "email"),
    password: text(formData, "password"),
  };
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
    // One message for unknown email and wrong password, to avoid account enumeration.
    return {
      error: "Incorrect email or password.",
      values: { email: raw.email },
    };
  }

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
    // Copied into public.users.name by the on_auth_user_created trigger.
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

  // Only reachable if email confirmation is enabled in Supabase.
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
