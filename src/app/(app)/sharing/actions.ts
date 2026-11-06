"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type AddCoachState, addCoachSchema } from "@/lib/validation/coaching";
import { requireUser } from "@/server/auth";
import {
  addCoach,
  CoachNotFoundError,
  NotAnAthleteError,
  removeCoach,
} from "@/server/coaching";

export async function addCoachAction(
  _prev: AddCoachState,
  formData: FormData,
): Promise<AddCoachState> {
  const user = await requireUser();
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw : "";

  const parsed = addCoachSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: "Enter a valid email address.", values: { email } };
  }

  try {
    const coach = await addCoach(user.id, parsed.data.email);
    revalidatePath("/sharing");
    return { success: `${coach.name} can now see your workouts.` };
  } catch (err) {
    if (err instanceof CoachNotFoundError || err instanceof NotAnAthleteError) {
      return { error: err.message, values: { email } };
    }
    console.error("addCoach failed", err);
    return { error: "Couldn't add that coach. Please try again." };
  }
}

export async function removeCoachAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const coachId = z.uuid().safeParse(formData.get("coachId"));
  if (!coachId.success) return;

  await removeCoach(user.id, coachId.data);
  revalidatePath("/sharing");
}
