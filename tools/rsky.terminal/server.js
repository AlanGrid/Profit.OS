// ============================================================
// rsky.trade writer — ONE job: POST /trade -> append one line
// No event system. No reducer. No state.
// Run: node server.js
// ============================================================

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

      // required fields — fail loud if filter sent something malformed
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
