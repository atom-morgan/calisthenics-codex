// Stands in for "@/db" in tests: vi.mock("@/db", () => import("@/test/mock-db")).
// Vitest isolates modules per test file, so each file gets its own database.
import { createTestDb } from "./db";

export const db = await createTestDb();
