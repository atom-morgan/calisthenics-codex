import { z } from "zod";
import { emailSchema } from "./auth";

export const addCoachSchema = z.object({ email: emailSchema });

export type AddCoachState = {
  error?: string;
  success?: string;
  values?: { email?: string };
};
