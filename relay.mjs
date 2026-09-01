#!/usr/bin/env node
// Built from packages/plugin by scripts/build-plugin.mjs — edit the source, not this.

// packages/plugin/src/relay.mjs
import { connect } from "node:net";
import { appendFileSync } from "node:fs";

// packages/plugin/src/sock.mjs
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, statSync } from "node:fs";
function floorDir() {
  return process.env.FLOOR_HOME ?? join(homedir(), ".floor");
}
function sockDir() {
  const hash = createHash("sha256").update(floorDir()).digest("hex").slice(0, 12);
  return join("/tmp", `floor-${hash}`);
}
function sockPath() {
  return join(sockDir(), "s.sock");
}
function unclaimedPath() {
  return join(sockDir(), "unchecked.log");
}
function ensurePrivateSockDir() {
  const dir = sockDir();
  try {
    mkdirSync(dir, { recursive: true, mode: 448 });
  } catch (e) {
    if (e?.code !== "EEXIST") return `cannot create ${dir}: ${e?.code ?? e}`;
  }
  let st;
  try {
    st = statSync(dir);
  } catch (e) {
    return `cannot stat ${dir}: ${e?.code ?? e}`;
  }
  if (!st.isDirectory()) return `${dir} is not a directory`;
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) {
    return `${dir} belongs to uid ${st.uid}, not to you`;
  }
  if (st.mode & 63) {
    return `${dir} is mode ${(st.mode & 511).toString(8)}, not 700`;
  }
  return null;
}

// packages/plugin/src/relay.mjs
var SOCK = sockPath();
var trace = (m) => {
  if (!process.env.FLOOR_DEBUG) return;
  try {
    appendFileSync("/tmp/floor-relay.log", `${Date.now()} ${m}
`);
  } catch {
  }
};
var OK = () => {
  process.stdout.write("{}");
  process.exit(0);
};
var FLOOR_MS = 1e3;
var CEILING_MS = 3e4;
var asked = Number(process.env.FLOOR_HOOK_TIMEOUT_MS);
var TIMEOUT_MS = Number.isFinite(asked) && asked > 0 ? Math.min(Math.max(asked, FLOOR_MS), CEILING_MS) : 1500;
var recordUnchecked = (payload) => {
  try {
    const tool = payload?.tool_name ?? "a tool";
    const what = payload?.tool_input?.file_path ?? payload?.tool_input?.command ?? payload?.tool_input?.notebook_path ?? "";
    appendFileSync(
      unclaimedPath(),
      JSON.stringify({ at: Date.now(), tool, what: String(what).slice(0, 200) }) + "\n",
      { mode: 384 }
    );
  } catch {
  }
};
var ALLOW_UNCHECKED = () => {
  recordUnchecked(parsed);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: "Floor did not answer in time, so this was not checked against the room's claims. Another agent may be editing the same file. If this touches shared code, say so in the room."
    }
  }));
  process.exit(0);
};
var bail = setTimeout(OK, TIMEOUT_MS);
bail.unref?.();
var raw = "";
try {
  for await (const chunk of process.stdin) raw += chunk;
} catch {
  OK();
}
trace(`fired, ${raw.length} bytes`);
var parsed = null;
var wantsReply = false;
var isWrite = false;
try {
  parsed = JSON.parse(raw || "{}");
  isWrite = parsed?.hook_event_name === "PreToolUse";
  wantsReply = isWrite || parsed?.hook_event_name === "UserPromptSubmit";
} catch {
}
if (wantsReply) {
  clearTimeout(bail);
  bail = setTimeout(isWrite ? ALLOW_UNCHECKED : OK, TIMEOUT_MS);
  bail.unref?.();
}
var unsafe = ensurePrivateSockDir();
if (unsafe) {
  trace(`refusing unsafe socket dir: ${unsafe}`);
  if (isWrite) ALLOW_UNCHECKED();
  OK();
}
try {
  const sock = connect(SOCK);
  sock.on("error", (e) => {
    trace(`socket error ${e.code}`);
    if (isWrite) ALLOW_UNCHECKED();
    OK();
  });
  sock.on("connect", () => {
    sock.write(raw.endsWith("\n") ? raw : raw + "\n");
    if (!wantsReply) {
      sock.end(() => {
        clearTimeout(bail);
        trace("delivered");
        OK();
      });
      return;
    }
    let reply = "";
    sock.on("data", (d) => {
      reply += d;
      if (!reply.includes("\n")) return;
      clearTimeout(bail);
      trace(`verdict ${reply.trim().slice(0, 60)}`);
      process.stdout.write(reply.trim());
      process.exit(0);
    });
    sock.on("end", () => {
      clearTimeout(bail);
      if (isWrite) ALLOW_UNCHECKED();
      OK();
    });
  });
} catch {
  OK();
}
