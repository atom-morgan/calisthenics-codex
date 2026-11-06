"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/actions/auth";
import { FormField } from "@/components/form-field";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/lib/validation/auth";
import { RolePicker } from "./role-picker";

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
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {mode === "signup" && (
          <RolePicker
            defaultValue={state.values?.role}
            error={state.fieldErrors?.role?.join(" ")}
          />
        )}
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

        {state.error && <ErrorAlert>{state.error}</ErrorAlert>}

        <Button type="submit" disabled={pending}>
          {pending ? copy.pending : copy.submit}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {copy.switchText}{" "}
        <Link
          href={copy.switchLink.href}
          className="font-medium text-accent-text hover:underline"
        >
          {copy.switchLink.label}
        </Link>
      </p>
    </div>
  );
}
