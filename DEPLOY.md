# Deploying Outlands Group Finder

The app uses **PostgreSQL** (via Prisma). You can run it locally first, then deploy to Vercel with a hosted Postgres database (e.g. Neon).

**If local already works**, go straight to **[§ 2. Deploy to Vercel](#2-deploy-to-vercel)**.

---

## 1. Local setup (PostgreSQL)

### Option A: Neon (hosted Postgres, no local install)

1. Create a free account at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string (e.g. `postgresql://user:pass@ep-….us-east-1.aws.neon.tech/neondb?sslmode=require`).
3. In your project root, copy `.env.example` to `.env` and set:
   - `DATABASE_URL` = the Neon connection string.
   - Fill in Discord and NextAuth vars as before (see checklist below).
4. Run migrations and seed:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Start the app: `npm run dev`. Test create/join groups and Discord login.

### Option B: Local Postgres (Docker or installed)

**Full step-by-step:** See **[docs/LOCAL_POSTGRES_SETUP.md](docs/LOCAL_POSTGRES_SETUP.md)** for detailed instructions (Docker, Windows, macOS, Linux).

Short version:

1. Start PostgreSQL (e.g. `docker run -d --name outlands-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=outlands_group_finder -p 5432:5432 postgres:16`, or use a local install).
2. In `.env` set:
   - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/outlands_group_finder"` (adjust user/password/db name to match your setup).
3. Run:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
4. Run `npm run dev` and test.

---

## 2. Deploy to Vercel

Once the app works locally with Postgres:

1. **Push your code to GitHub** (if you haven’t already).  
   **New to Git/GitHub?** Follow **[docs/GITHUB_PUSH_GUIDE.md](docs/GITHUB_PUSH_GUIDE.md)** for a full step-by-step (account, install Git, create repo, push).
2. **Create a production database (Neon):** Go to [neon.tech](https://neon.tech), create a **new** project (e.g. “outlands-production”). Copy the connection string — you’ll use it on Vercel and to run migrations.
3. **Import the repo on Vercel:** [vercel.com](https://vercel.com) → **Add New** → **Project** → import your GitHub repo. Vercel will show your project URL (e.g. `outlands-group-finder.vercel.app`).
4. **Set environment variables** in the Vercel project (Settings → Environment Variables). Add:
   - `DATABASE_URL` = the **production** Neon connection string (from step 2).
   - `NEXTAUTH_URL` = `https://YOUR_PROJECT_URL` (the URL Vercel showed, e.g. `https://outlands-group-finder.vercel.app`).
   - `NEXTAUTH_SECRET` = same as local or a new one: `openssl rand -base64 32`.
   - `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` = same as local.
5. **Discord OAuth redirect:** In [Discord Developer Portal](https://discord.com/developers/applications) → your app → OAuth2 → Redirects, **add** (don’t remove localhost):
   - `https://YOUR_PROJECT_URL/api/auth/callback/discord`  
   (use the same URL as `NEXTAUTH_URL`, e.g. `https://outlands-group-finder.vercel.app/api/auth/callback/discord`).
6. **Deploy:** Trigger a deploy (e.g. push a commit, or “Redeploy” in Vercel). The build runs `prisma generate` and `next build`.
7. **Apply migrations and seed to production:** From your **local** machine, point Prisma at the production DB once. In a terminal, set the production URL and run:
   ```bash
   set DATABASE_URL=postgresql://...your-production-neon-URL...
   npx prisma migrate deploy
   npx prisma db seed
   ```
   (On macOS/Linux use `export DATABASE_URL=...` instead of `set`.) Or use a second `.env.production` and run the same commands. This creates tables and seed data in the Neon DB that Vercel uses.
8. Open `https://YOUR_PROJECT_URL` and test. Share the link with your friends.

---

## Checklist before going live

- [ ] Local app works with Postgres (you’re done with this).
- [ ] Repo is on GitHub and connected to Vercel.
- [ ] Production Neon project created and its URL set as `DATABASE_URL` on Vercel.
- [ ] All other env vars set on Vercel: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`.
- [ ] Discord OAuth redirect includes `https://YOUR_PROJECT_URL/api/auth/callback/discord` (keep localhost for local testing).
- [ ] After first deploy: ran `prisma migrate deploy` and `prisma db seed` with `DATABASE_URL` pointing at the production Neon DB.

Then you’re live. Share the Vercel URL with your friends.
