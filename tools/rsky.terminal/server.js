// ============================================================
// DEPRECATED — DO NOT RUN
// ============================================================
// This writer is retired as of the rsky.trade.html -> :8787/event
// migration. It wrote flat pipe-delimited lines to
// rsky.crv\03-Journal\jup.trades\*.log, bypassing the event-sourced
// journal entirely (no tradeId, no pattern, no PLAN_SET/EXECUTE/EXIT
// lifecycle — just a single line per trade with no outcome tracking).
//
// Current architecture:
//   HTML UI -> emits events -> /event (local-listener.ts)
//     -> JSONL immutable ledger (write-event.ts -> journal.jsonl)
//     -> Obsidian projection (read-model.ts)
//
// rsky_trade.html now posts directly to local-listener.ts on :8787.
// This file is kept in the repo only as a historical reference for
// the old .log format that earlier trade logs (e.g.
// rsky.trade-jup-2026-06-28.log) were written in. It refuses to run
// to prevent accidentally reintroducing a second, disconnected write
// path into the system.
//
// If you need the old flat-log trail for some reason, do not revive
// this — instead derive it from journal.jsonl via a read-model
// projection, so there remains exactly ONE source of truth.
// ============================================================

throw new Error(
  "server.js is deprecated and retired. Trade events now flow " +
  "HTML -> local-listener.ts (:8787/event) -> journal.jsonl. " +
  "Do not run this file. See header comment for details."
);

/* ---- original implementation, preserved for reference only ----

import http from "http";
import fs from "fs";
import path from "path";

const PORT = 3117;
const JOURNAL_DIR = "D:\\Users\\RSky\\Desktop\\AI.ProFit\\rsky.crv\\03-Journal\\jup.trades";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/trade") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const t = JSON.parse(body);

      const required = ["time", "asset", "side", "entry", "stop", "target", "rr", "date"];
      for (const k of required) {
        if (t[k] === undefined || t[k] === null || t[k] === "") {
          throw new Error(`missing field: ${k}`);
        }
      }

      const line = `${t.time} | ${t.asset} | ${t.side} | ${t.entry} | ${t.stop} | ${t.target} | ${t.rr} | result=OPEN\n`;

      if (!fs.existsSync(JOURNAL_DIR)) {
        fs.mkdirSync(JOURNAL_DIR, { recursive: true });
      }

      const file = path.join(JOURNAL_DIR, `rsky.trade-${t.asset}-${t.date}.log`);
      fs.appendFileSync(file, line, "utf8");

      console.log(`[written] ${file} <- ${line.trim()}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, file }));
    } catch (err) {
      console.error("[error]", String(err));
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`rsky.trade writer listening on http://localhost:${PORT}/trade`);
  console.log(`writing to: ${JOURNAL_DIR}`);
});

---- end original implementation ---- */
