## Outlands Group Finder

This is a very simple prototype for a web application where people can create groups for in-game activities in the MMORPG **Ultima Online Outlands**, and other users can sign up for those groups.

### Stack

- **Next.js** (React framework)
- **TypeScript**
- **Tailwind CSS** for styling
- **Discord login** using `next-auth` (OAuth2)
- **Prisma** + **PostgreSQL** for the database (groups and members)

### What is implemented right now

- A home page that:
  - Shows your current group (if any) in a highlighted card.
  - Lists all available groups with content type, members, and join/leave/delete actions.
  - Automatically updates when anyone creates, joins, leaves, or deletes a group (via Pusher).
- A `Create group` flow with:
  - Top-level categories: PvM, PvP, Mentoring, Roleplay, Custom.
  - Secondary/tertiary options for PvM/PvP (dungeons, pit trials, treasure maps, proving grounds, etc.).
  - Description rules for Custom, Society Jobs, and Quests.
  - Role selection for Mentoring (Guide/Student).
- Discord login via `next-auth`:
  - JWT stores Discord ID, name, avatar.
  - Session exposes these to the frontend; group membership is tied to Discord ID.
- PostgreSQL (via Prisma) with:
  - `Group` and `GroupMember` models.
  - Seed script that creates several preset test groups.

