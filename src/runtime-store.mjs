import { join } from "node:path";
import { JsonStore, SupabaseStore } from "./store.mjs";
import { readRuntimeConfig, assertHostedConfiguration } from "./config.mjs";

let store;

export function createQipiStore({ env = process.env, dataFile = join(process.cwd(), "data", "store.json") } = {}) {
  const config = readRuntimeConfig(env);
  assertHostedConfiguration(config);
  return config.supabaseUrl && config.secretKey
    ? new SupabaseStore({ url: config.supabaseUrl, key: config.secretKey })
    : new JsonStore(dataFile);
}

export function getQipiStore() {
  if (!store) store = createQipiStore();
  return store;
}
