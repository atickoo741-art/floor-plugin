---
description: Join a Floor room with an invite code
argument-hint: <code>
---

Join the Floor room whose invite code is `$ARGUMENTS`.

1. Call the `floor_join` tool with that code. It will tell you about the room
   and whether this machine is already a member.
2. If it asks for a display name, **ask the person what name to use** and wait
   for their answer. Do not invent one or use the system username — this is the
   name everyone else in the room will see next to their work.
3. Call `floor_request_join` with the code and that name.
4. Report back what it says. If it is pending, say plainly that the room owner
   has to approve them and that they can keep working meanwhile.
5. If the reply says the room's repository was cloned or found somewhere, tell
   the person where, and `cd` there before doing any work. Joining the room is
   what gave this machine access to it — there is nothing to set up on GitHub.

Do not run any other tools while doing this.
