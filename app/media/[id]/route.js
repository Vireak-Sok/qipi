import { createMediaHandler } from "../../../src/server/media.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = createMediaHandler();
export const GET = handle;
export const HEAD = handle;
