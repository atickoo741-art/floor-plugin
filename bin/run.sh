#!/bin/sh
# Find a JavaScript runtime, and say something useful when there isn't one.
#
# Claude Code 2.x ships as a self-contained binary and does not need Node, so a
# person can perfectly well have Claude Code and no `node` at all. The plugin
# does need one — an MCP server over stdio has to be run by something — and
# .mcp.json used to say `command: "node"` flatly. When that was missing, all
# anyone saw was:
#
#   plugin:floor:floor MCP server failed to connect at startup
#   Skipping connection (recent failure cached; retries automatically in 15 min)
#
# which says nothing about Node, so the install looked broken rather than
# incomplete. Someone hit exactly that, went off and installed Homebrew to fix
# it, and still could not join.
#
# The second reason this exists is PATH. Homebrew puts node in /opt/homebrew/bin
# and nvm and fnm put it somewhere else again, and a Claude Code launched from
# Spotlight or the Dock does not inherit the shell profile that adds any of
# them. "It works in my terminal and not in the app" is that, every time.
#
# POSIX sh, because /bin/sh is the one thing that is always there.

find_node() {
  if command -v node >/dev/null 2>&1; then command -v node; return 0; fi

  for p in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node \
           "$HOME/.volta/bin/node" "$HOME/.local/bin/node"; do
    if [ -x "$p" ]; then echo "$p"; return 0; fi
  done

  # Version managers: newest first, since an old default is still a default.
  for d in "$HOME/.nvm/versions/node" "$HOME/.local/share/fnm/node-versions" \
           "$HOME/Library/Application Support/fnm/node-versions"; do
    [ -d "$d" ] || continue
    for v in $(ls -1 "$d" 2>/dev/null | sort -rV); do
      for c in "$d/$v/bin/node" "$d/$v/installation/bin/node"; do
        if [ -x "$c" ]; then echo "$c"; return 0; fi
      done
    done
  done
  return 1
}

NODE=$(find_node) || NODE=""

if [ -n "$NODE" ]; then
  exec "$NODE" "$@"
fi

cat >&2 <<'WHY'
floor: no Node.js runtime found, so the Floor plugin cannot run.

Claude Code does not need Node, but this plugin does — it runs a small server
on your machine. Install it once and restart Claude Code:

  macOS     brew install node
  or        https://nodejs.org  (the LTS download)

If you DO have node, Claude Code was probably started without your shell's
PATH — launch it from a terminal rather than from Spotlight or the Dock.
WHY

# The relay is a hook on every tool call, and rule 2b says Floor must never be
# the reason a terminal stops working. No runtime is the most total version of
# "the check did not happen", so it exits clean and lets the tool through; the
# note above is on stderr where the person can find it. The server exits
# non-zero, because that is what puts a real reason in /mcp instead of a
# connection that mysteriously never came up.
case "$1" in
  *relay.mjs) printf '%s\n' '{}' ; exit 0 ;;
  *) exit 1 ;;
esac
