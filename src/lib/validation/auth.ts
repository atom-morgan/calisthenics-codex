import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  // No length rule on login: just check something was typed. Password rules
  // belong to signup; enforcing them here would only leak policy details.
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use at most 72 characters."), // bcrypt's input limit
});

// What a Server Action sends back to its form. `values` lets the form refill
// fields after a failed submit (React resets uncontrolled forms on submit).
export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
  values?: { name?: string; email?: string };
};
