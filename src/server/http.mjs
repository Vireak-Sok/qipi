class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function body(req, { maxBytes = 16_384 } = {}) {
  if (typeof req.headers["content-type"] !== "string" ||
      !req.headers["content-type"].startsWith("application/json")) {
    throw new HttpError(415, "Send JSON content");
  }
  let raw;
  if (req.body !== undefined && req.body !== null) {
    raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  } else {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) throw new HttpError(413, "Request is too large");
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.byteLength(raw, "utf8") > maxBytes) throw new HttpError(413, "Request is too large");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object required");
    return value;
  } catch {
    throw new HttpError(400, "Invalid JSON object");
  }
}

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(value));
}

function createResponder(res) {
  return (status, value) => { json(res, status, value); return true; };
}

export { HttpError, body, json, createResponder };
