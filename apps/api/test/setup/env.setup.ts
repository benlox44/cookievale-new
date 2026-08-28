import { applyTestEnv } from "./test-config";

/** Runs in each worker before the app boots, so loadConfig() sees the test DB. */
applyTestEnv();
