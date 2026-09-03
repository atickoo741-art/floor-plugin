---
description: Turn auto mode on or off for this terminal's agent
argument-hint: <on|off>
---

The person here wants auto mode `$ARGUMENTS` for this terminal's agent.

1. If they asked for **on**, tell them plainly what they are agreeing to, in
   your own words, before calling anything:
   - the turn will stop ending — each time you finish, Floor hands over the
     next task on the room's list and you carry straight on
   - that includes tasks and instructions written by other people in the room,
     with no approval per task
   - it runs on this machine, on their own Claude subscription
   - it stops after 10 tasks, 45 minutes, or the first task you cannot do
2. Call `floor_auto` with `on: true` or `on: false` to match what they asked.
3. Report what it says. If it turned on, say that nothing happens until the
   current turn ends — a turn already running is not interrupted.

Do not ask them to confirm again: typing the command is the answer. Do not run
any other tools while doing this.
