import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const envSchema = z.object({ ANTHROPIC_API_KEY: z.string().min(1) });

let client: Anthropic | undefined;

/**
 * Created on first use so a missing key fails the parse request, not the build
 * or every page that imports this module.
 */
export function getAnthropic(): Anthropic {
  client ??= new Anthropic({
    apiKey: envSchema.parse(process.env).ANTHROPIC_API_KEY,
    timeout: 15_000,
    maxRetries: 1,
  });
  return client;
}
