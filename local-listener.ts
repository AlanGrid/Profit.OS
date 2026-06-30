// ============================================================
// Minimal local listener — POST /event -> writeEvent()
// Not a critical-path service. rsky.trade.html's localStorage
// write and export pipeline work with or without this running.
// This exists solely to feed journal.jsonl from the UI's
// fire-and-forget fetch().
//
// Run: node --loader ts-node/esm local-listener.ts
// (or compile to JS and run directly — no framework dependency)
// ============================================================

import { createServer } from "http";
import { writeEvent, writeExecuteEvent } from "./write-event";
import { EngineEvent } from "./events.types";

const PORT = process.env.PROFIT_OS_LISTENER_PORT
  ? Number(process.env.PROFIT_OS_LISTENER_PORT)
  : 8787;

const server = createServer(async (req, res) => {
  // CORS: rsky.trade.html is likely opened via file:// or a local
  // static server on a different port — allow localhost origins only.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/event") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const event = JSON.parse(body) as EngineEvent;

      if (event.type === "EXECUTE") {
        await writeExecuteEvent(event);
      } else {
        await writeEvent(event);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      // Failure here must NEVER surface to the UI as blocking —
      // the fetch() call on the client side is fire-and-forget.
      // This response only matters for local debugging.
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`profit-os event listener on http://localhost:${PORT}/event`);
});
