# Setting up PostgreSQL locally

This guide walks you through running PostgreSQL on your machine so you can develop the Outlands Group Finder app locally. Choose **one** of the options below.

---

## Option 1: Docker (recommended)

Docker runs Postgres in a container. You don’t install Postgres directly on your system.

### 1. Install Docker

- **Windows / Mac:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
- **Linux:** Install the Docker engine for your distro (e.g. `sudo apt install docker.io` on Ubuntu), start the service, and ensure your user can run `docker` (e.g. add yourself to the `docker` group).

### 2. Start PostgreSQL

In a terminal (PowerShell, Command Prompt, or bash), run:

```bash
docker run -d --name outlands-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=outlands_group_finder -p 5432:5432 postgres:16
```

What this does:

- `-d` – run in the background
- `--name outlands-postgres` – container name (so you can stop/start it by name)
- `-e POSTGRES_PASSWORD=postgres` – password for the default user `postgres`
- `-e POSTGRES_DB=outlands_group_finder` – creates a database with this name
- `-p 5432:5432` – exposes Postgres on port 5432 on your machine
- `postgres:16` – official Postgres 16 image

### 3. Connection string and `.env`

The app connects via a URL. For this Docker setup use:

```
postgresql://postgres:postgres@localhost:5432/outlands_group_finder
```

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

- **USER:** `postgres` (default user created by the image)
- **PASSWORD:** `postgres` (what you set with `POSTGRES_PASSWORD`)
- **HOST:** `localhost`
- **PORT:** `5432`
- **DATABASE:** `outlands_group_finder` (created by `POSTGRES_DB`)

In your **project root**, create or edit `.env` and set:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/outlands_group_finder"
```

(Plus your existing Discord and NextAuth variables.)

### 4. Apply migrations and seed

In the project root, ensure the Prisma client matches your Postgres schema (run this after changing `DATABASE_URL` or if you see a “URL must start with `file:`” error):

```bash
npx prisma generate
```

Then run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Then start the app with `npm run dev`.

### 5. Useful Docker commands

- **Stop Postgres:** `docker stop outlands-postgres`
- **Start it again:** `docker start outlands-postgres`
- **Remove the container (data is lost):** `docker rm -f outlands-postgres` then run the `docker run` command again to recreate it.

---

## Option 2: Install PostgreSQL on Windows

### 1. Download and install

1. Go to [PostgreSQL downloads for Windows](https://www.postgresql.org/download/windows/).
2. Use the **EDB installer** (recommended). Download the latest 16.x.
3. Run the installer. When asked:
   - Set a **password** for the `postgres` superuser (e.g. `postgres`; remember it).
   - Keep the default port **5432** unless you already use it.
   - Install **Stack Builder** only if you need extra tools (optional).

### 2. Create a database (GUI or command line)

**Using pgAdmin (installed with Postgres):**

1. Open **pgAdmin**. Connect to the default server (it will ask for the `postgres` password).
2. Right‑click **Databases** → **Create** → **Database**.
3. Name it `outlands_group_finder`. Save.

**Using command line:**

1. Open a terminal. Add the Postgres `bin` to your PATH if needed, e.g.  
   `C:\Program Files\PostgreSQL\16\bin`
2. Run:

   ```bash
   psql -U postgres -c "CREATE DATABASE outlands_group_finder;"
   ```

   Enter the `postgres` password when prompted.

### 3. Connection string and `.env`

Use the password you set during installation:

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/outlands_group_finder
```

In your project `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/outlands_group_finder"
```

### 4. Migrate and seed

In the project root:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Then `npm run dev`.

---

## Option 3: Install PostgreSQL on macOS

### 1. Install with Homebrew

If you don’t have Homebrew: [brew.sh](https://brew.sh).

```bash
brew install postgresql@16
brew services start postgresql@16
```

(On Apple Silicon you may need to run `brew services start postgresql@16` and ensure the `postgres` user and default DB exist; Homebrew usually sets this up.)

### 2. Create a database

```bash
createdb outlands_group_finder
```

If that fails, connect as the default user and create it:

```bash
psql postgres -c "CREATE DATABASE outlands_group_finder;"
```

(Your macOS user is often a superuser; if not, use `psql -U postgres` and the password you configured.)

### 3. Connection string and `.env`

Often no password is needed for the local user:

```
postgresql://localhost:5432/outlands_group_finder
```

If your setup uses a user and password:

```
postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/outlands_group_finder
```

Put the correct URL in `.env` as `DATABASE_URL`.

### 4. Migrate and seed

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

---

## Option 4: Install PostgreSQL on Linux (Ubuntu/Debian)

### 1. Install and start

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create a user and database

Postgres creates a `postgres` system user. Switch to it and create a DB (and optionally a dedicated user):

```bash
sudo -u postgres psql
```

In the `psql` prompt:

```sql
CREATE USER outlands WITH PASSWORD 'postgres';
CREATE DATABASE outlands_group_finder OWNER outlands;
\q
```

(You can reuse the `postgres` user and only create the database if you prefer.)

### 3. Connection string and `.env`

With the user above:

```
postgresql://outlands:postgres@localhost:5432/outlands_group_finder
```

Set this in `.env` as `DATABASE_URL`.

### 4. Migrate and seed

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

---

## After Postgres is running (any option)

1. **`.env`** in the project root must contain:
   - `DATABASE_URL` – one of the URLs above (or your own user/password/db name).
   - Your existing **Discord** and **NextAuth** variables (see `.env.example`).

2. **First-time setup:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Start the app:**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`, create/join groups, and test Discord login.

---

## Troubleshooting

- **“The URL must start with the protocol `postgresql://` or `postgres://`” when running `npm run dev`:**  
  Next.js loads **`.env.local`** before **`.env`**, and `.env.local` overrides `.env`. If `.env.local` still has the old SQLite URL (`file:./dev.db`), the app will use that. Open **`.env.local`** and set `DATABASE_URL` to your Postgres URL (e.g. `postgresql://postgres:postgres@localhost:5432/outlands_group_finder`), or remove the `DATABASE_URL` line from `.env.local` so the value from `.env` is used. Then restart `npm run dev`.

- **“Connection refused” or “could not connect”:**  
  Postgres isn’t running or isn’t on port 5432. Start the service (Docker container, `brew services`, `systemctl`, or Windows service) and check that nothing else is using 5432.

- **“password authentication failed”:**  
  The user or password in `DATABASE_URL` doesn’t match the Postgres user/password. Fix the URL in `.env` or reset the password in Postgres.

- **“database does not exist”:**  
  Create the database (see the “Create a database” step for your option) and use that exact name in `DATABASE_URL`.

- **Prisma errors after changing `.env`:**  
  Run `npx prisma generate` and try again.
