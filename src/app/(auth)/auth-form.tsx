"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import type { AuthFormState } from "@/lib/validation/auth";
import { login, signup } from "./actions";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Log in",
    submit: "Log in",
    pending: "Logging in…",
    switchText: "No account yet?",
    switchLink: { href: "/signup", label: "Sign up" },
  },
  signup: {
    title: "Create an account",
    submit: "Sign up",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Log in" },
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? login : signup,
    {},
  );
  const copy = COPY[mode];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{copy.title}</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {mode === "signup" && (
          <FormField
            label="Name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name}
            errors={state.fieldErrors?.name}
            required
          />
        )}
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          errors={state.fieldErrors?.password}
          required
        />

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {copy.switchText}{" "}
        <Link href={copy.switchLink.href} className="font-medium underline">
          {copy.switchLink.label}
        </Link>
      </p>
    </div>
  );
}
