import { applyTestEnv } from "./test-config";

// Runs in each test worker before the app boots, so loadConfig() sees the
// test database + throwaway media dir.
applyTestEnv();
