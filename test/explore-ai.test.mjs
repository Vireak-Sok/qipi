import test from "node:test";
import assert from "node:assert/strict";
import { handleExploreAiRoutes } from "../src/server/explore-ai-routes.mjs";

test("Explore AI resolves a photo suggestion through map geocoding", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("generativelanguage.googleapis.com")) {
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: "This may be the Royal Palace in Phnom Penh.", placeQueries: ["Royal Palace Phnom Penh"] }) }] } }] });
    }
    return Response.json({ features: [{ place_name: "Royal Palace, Phnom Penh", center: [104.9315, 11.5634] }] });
  };
  const response = { writeHead(status) { this.status = status; return this; }, end(value) { this.value = JSON.parse(value); } };
  try {
    const handled = await handleExploreAiRoutes({
      req: { headers: { "content-type": "application/json", "x-real-ip": "test-photo", host: "qipi.vercel.app" }, body: { message: "Where is this?", image: { mimeType: "image/jpeg", data: "YWJj" } } },
      res: response, path: "/api/explore/ai", method: "POST",
      config: { geminiApiKey: "test-secret", geminiModel: "gemini-test", maptilerPublicKey: "test-map-key" }
    });
    assert.equal(handled, true);
    assert.equal(response.status, 200);
    assert.deepEqual(response.value.places, [{ name: "Royal Palace, Phnom Penh", latitude: 11.5634, longitude: 104.9315 }]);
    assert.equal(calls.length, 2);
    assert.match(calls[0].options.body, /inlineData/);
    assert.match(calls[1].url, /Royal%20Palace%20Phnom%20Penh/);
    assert.equal(new URL(calls[1].url).searchParams.get("types"), "poi");
    assert.equal(calls[1].options.headers.Origin, "https://qipi.vercel.app");
  } finally { globalThis.fetch = originalFetch; }
});
