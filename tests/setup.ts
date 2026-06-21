/**
 * Test setup — runs before all test files.
 * Uses an in-memory SQLite database to avoid polluting data.db.
 */
import { vi } from "vitest";

// Override the database path to use an in-memory DB for all tests
// so tests are isolated and don't affect production data.db
process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
