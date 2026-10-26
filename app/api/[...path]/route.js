import { createQipiHandler } from "../../../src/server/application.mjs";
import { getQipiStore } from "../../../src/runtime-store.mjs";
import { readRuntimeConfig, assertHostedConfiguration } from "../../../src/config.mjs";
import { createWebHandler } from "../../../src/server/web-handler.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let application;
const handle = createWebHandler(() => {
  assertHostedConfiguration(readRuntimeConfig());
  if (!application) application = createQipiHandler({ store: getQipiStore() });
  return application;
});

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
