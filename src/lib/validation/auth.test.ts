import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("normalizes the email", () => {
    const parsed = loginSchema.parse({
      email: "  Adam@Example.COM ",
      password: "x",
    });
    expect(parsed.email).toBe("adam@example.com");
  });

  it("requires a password but no particular length", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email with a field error", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    if (result.success) throw new Error("expected validation to fail");
    expect(z.flattenError(result.error).fieldErrors).toEqual({
      email: ["Enter a valid email address."],
    });
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "Adam",
    email: "adam@example.com",
    password: "12345678",
    role: "athlete",
  };

  it("accepts a valid signup and trims the name", () => {
    expect(signupSchema.parse({ ...valid, name: "  Adam  " }).name).toBe(
      "Adam",
    );
  });

  it.each(["athlete", "coach"])("accepts the %s role", (role) => {
    expect(signupSchema.safeParse({ ...valid, role }).success).toBe(true);
  });

  it.each([
    ["missing", undefined],
    ["unknown", "admin"],
  ])("rejects a %s role", (_label, role) => {
    const result = signupSchema.safeParse({ ...valid, role });
    if (result.success) throw new Error("expected validation to fail");
    expect(z.flattenError(result.error).fieldErrors).toEqual({
      role: ["Choose athlete or coach."],
    });
  });

  it("rejects a blank name", () => {
    expect(signupSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
  });

  it.each([
    ["7 characters", "1234567", false],
    ["8 characters", "12345678", true],
    ["72 characters", "x".repeat(72), true],
    ["73 characters", "x".repeat(73), false],
  ])("password of %s is valid: %s", (_label, password, ok) => {
    expect(signupSchema.safeParse({ ...valid, password }).success).toBe(ok);
  });
});
