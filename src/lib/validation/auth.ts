import { z } from "zod";

// Normalize before validating: Zod runs checks in chain order, so
// z.email().trim() would reject " a@b.co" (e.g. a trailing space from mobile
// autocomplete) instead of trimming it.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use at most 72 characters."), // bcrypt's input limit
  role: z.enum(["athlete", "coach"], "Choose athlete or coach."),
});

// `values` refills fields after a failed submit, since React resets the form.
export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "email" | "password" | "role", string[]>
  >;
  values?: { name?: string; email?: string; role?: string };
};
