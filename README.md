## Outlands Group Finder

This is a very simple prototype for a web application where people can create groups for in-game activities in the MMORPG **Ultima Online Outlands**, and other users can sign up for those groups.

### Stack

- **Next.js** (React framework)
- **TypeScript**
- **Tailwind CSS** for styling
- **Discord login** using `next-auth` (OAuth2)
- **Prisma** + **SQLite** for the database (groups and members)

### What is implemented right now

- Basic Next.js project structure.
- A home page with:
  - Short explanation of the idea.
  - A button that will become "Sign in with Discord".
  - A few **placeholder groups** to show how cards could look.
- A simple `/login` page that explains the Discord login flow (also placeholder for now).
- A basic `/api/auth/[...nextauth]` endpoint configured for Discord OAuth **(will work once you add environment variables and install dependencies)**.

### How Discord login will work

When properly configured, users will:

1. Click **"Sign in with Discord"**.
2. Be redirected to Discord to authorize the app.
3. After authorizing, they will be redirected back with:
   - Their Discord **ID**
   - Their **name**
   - Their **profile picture**

We configure `next-auth` so that:

- The **JWT token** stores the Discord ID, name, and avatar.
- The **session** that the frontend can read includes these fields.

Later, we can use this information to:

- Create and show user profiles.
- Associate created groups and sign-ups with the correct Discord user.

### Environment variables (not committed)

Copy `.env.example` to `.env.local` and fill in values. Add:

- **DISCORD_CLIENT_ID** / **DISCORD_CLIENT_SECRET** (from Discord Developer Portal)
- **NEXTAUTH_SECRET** / **NEXTAUTH_URL**
- **DATABASE_URL** – for local dev use `file:./dev.db` (SQLite file in `prisma/`). For production use a PostgreSQL URL.

### Database setup (first time)

```bash
npm install
npx prisma db push
npx prisma db seed
```

This creates the SQLite DB and seeds the preset test group. After that, `npm run dev` is enough.

### Installing and running (once Node.js and npm are installed)

From the project folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Next steps we can work on together

- Wire the "Sign in with Discord" button to the real `next-auth` login flow.
- Add a simple top-right user menu that shows:
  - Discord avatar
  - Discord name
  - "Sign out" button
- Add real data models for:
  - Users (based on Discord accounts)
  - Groups
  - Memberships (who joined which group)
- Create forms to:
  - Create a group
  - Join a group

Tell me what you want to customize next (e.g. styling, login behavior, group fields), and I will guide you step by step or write the code for you.

