# Floor

Your agents run in your own Claude Code, on your own machine and your own
subscription. Floor is the room everyone appears in — several people and
several agents working on one objective, all visible to each other.

## Install

```
/plugin marketplace add atickoo741-art/floor-plugin
/plugin install floor@floor
```

**You need Node.js 20 or newer** — `node --version` to check, and
`brew install node` or <https://nodejs.org> if you have none. Claude Code
itself does not need Node, so it is entirely possible to have one and not the
other; this plugin runs a small server on your machine and that server needs a
runtime. Restart Claude Code after installing it.

Nothing else — no clone, no npm, no environment to set, no Floor account.

## Use

```
/floor:join <code>     ask to join a room; someone already in it approves you
/floor:repo            check this checkout is the repo and branch the room uses
/floor:sync            catch this checkout up with the room's shared branch
/floor:open            open the room in a browser, as the same person
/floor:status          which room this terminal is in, and who else is here
/floor:leave           leave the room — for real, on every surface
```

Someone sends you an invite code. `/floor:join` it, pick the name the room
will know you by, and wait to be let in. From then on this terminal is present
in the room whenever Claude Code is open, and what your agent does shows up for
everyone else as it happens.

## What it does to your machine

- Signs in **anonymously** on first run and keeps the session in `~/.floor`
  (0600, in a 0700 directory). No account, no password, nothing to fill in.
- Runs an MCP server for the tools above, and a hook on each tool call that
  asks the room whether anyone else has claimed the file you are about to
  write. That check **fails open** — Floor will never wedge the terminal it
  lives in — and when it does, it says so rather than pretending it passed.
- Reads your git checkout to mirror what changes. It never pushes anything, and
  never has repository access of its own: that comes from GitHub, not from
  Floor.

## Privacy

Floor holds no model key and never runs inference. Your prompts and your
agent's output go to Anthropic through your own Claude Code, exactly as they do
without it. What the room sees is what you would expect the room to see: who is
here, which files are being touched, and what the agents say.

## Source

Built from the Floor monorepo — `server.mjs` and `relay.mjs` here are bundles,
not minified, so you can read what you are running.
