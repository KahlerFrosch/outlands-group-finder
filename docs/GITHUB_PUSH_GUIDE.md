# Pushing your code to GitHub (step by step)

This guide walks you through putting your project on GitHub so you can connect it to Vercel (or use it as a backup). If you’ve never used Git or GitHub before, follow the steps in order.

---

## 1. Create a GitHub account (if you don’t have one)

1. Go to [github.com](https://github.com).
2. Click **Sign up** and follow the steps (email, password, username).
3. Verify your email if GitHub asks you to.

You don’t need to install anything extra for the **website** part; we’ll use the GitHub website and your computer’s terminal (or Git Bash on Windows).

---

## 2. Install Git on your computer

Git is the tool that tracks your code and talks to GitHub.

- **Windows:** Download and run the installer from [git-scm.com/download/win](https://git-scm.com/download/win). Use the default options. After installing, open **Git Bash** or **PowerShell** for the commands below.
- **macOS:** Open Terminal and run: `xcode-select --install` (if you don’t have Git yet), or install from [git-scm.com](https://git-scm.com).
- **Linux:** Install with your package manager, e.g. `sudo apt install git` (Ubuntu/Debian).

Check that it works:

```bash
git --version
```

You should see something like `git version 2.43.0`.

---

## 3. Tell Git your name and email (one-time setup)

Git needs your name and email for the “author” of each commit. Run these once (use your real name and the email tied to your GitHub account):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 4. Create a new repository on GitHub

1. Log in to [github.com](https://github.com).
2. Click the **+** (top right) → **New repository**.
3. Fill in:
   - **Repository name:** e.g. `outlands-group-finder` (no spaces; use letters, numbers, hyphens).
   - **Description:** optional, e.g. “Group finder for UO Outlands”.
   - **Public** is fine (your env vars and secrets stay on your machine and on Vercel, not in the code).
   - **Do not** check “Add a README” or “Add .gitignore” — your project already has files and a .gitignore.
4. Click **Create repository**.

You’ll see a page that says “Quick setup” and shows a URL like `https://github.com/YOUR_USERNAME/outlands-group-finder.git`. Leave this page open; you’ll need that URL in step 7.

---

## 5. Open a terminal in your project folder

- **Windows:** In File Explorer, go to your project folder (e.g. `C:\Users\thoma\Documents\Test`). In the address bar type `cmd` or `powershell` and press Enter. Or right‑click in the folder → “Open in Terminal” / “Open PowerShell window here”.
- **macOS/Linux:** Open Terminal, then run:
  ```bash
  cd /path/to/your/project
  ```
  (Replace with the real path, e.g. `cd ~/Documents/Test`.)

You should be inside the folder that contains `package.json`, `prisma/`, `src/`, etc.

---

## 6. Initialize Git and make the first commit (if the project isn’t a Git repo yet)

Run these commands **one at a time** in that terminal.

**Check if Git is already set up:**

```bash
git status
```

- If you see something like `fatal: not a git repository`, do the following.  
- If you see “On branch main” and a list of files, skip to **step 7** (and still read the “First time only” part there).

**First-time setup in the project folder:**

```bash
git init
```

This creates a hidden `.git` folder and makes the folder a Git repository.

**Add all files (respecting .gitignore):**

```bash
git add .
```

Your `.gitignore` already excludes `node_modules/`, `.env`, `.env.local`, `.next/`, and database files, so those won’t be added. Only source code and config are added.

**Save the first “snapshot” (commit):**

```bash
git commit -m "Initial commit: Outlands Group Finder app"
```

You should see a message like “X files changed” and “Y insertions”.

---

## 7. Connect the project to GitHub and push

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME`** with your actual GitHub username and the repository name you chose (e.g. `outlands-group-finder`).

**Add GitHub as the “remote” (only once per project):**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Example:

```bash
git remote add origin https://github.com/johndoe/outlands-group-finder.git
```

**Push your code to GitHub:**

```bash
git branch -M main
git push -u origin main
```

- `git branch -M main` renames the current branch to `main` (GitHub’s default).
- `git push -u origin main` uploads your commits to GitHub and sets `main` as the default branch for future pushes.

**If GitHub asks you to log in:**

- You may see a browser window or a prompt for username/password.
- **Username:** your GitHub username.  
- **Password:** do **not** use your normal GitHub password. Use a **Personal Access Token**:
  1. On GitHub: **Settings** (your profile menu) → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
  2. **Generate new token (classic)**. Give it a name (e.g. “Vercel deploy”), choose an expiry, and check the **repo** scope.
  3. Copy the token and paste it where Git asks for a password (the token won’t show as you type).

After a successful push, refresh your repository page on GitHub. You should see all your project files (except the ones in `.gitignore`).

---

## 8. Later: making changes and pushing again

Whenever you change code and want to update GitHub (and trigger a new deploy on Vercel):

```bash
git add .
git commit -m "Short description of what you changed"
git push
```

Example:

```bash
git commit -m "Add Roleplay category and fix Mentoring title"
git push
```

---

## Summary checklist

- [ ] GitHub account created.
- [ ] Git installed; `git --version` works.
- [ ] `user.name` and `user.email` set globally.
- [ ] New **empty** repository created on GitHub (no README/.gitignore added).
- [ ] In the project folder: `git init` (if needed), then `git add .` and `git commit -m "Initial commit..."`.
- [ ] `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`.
- [ ] `git branch -M main` and `git push -u origin main`.
- [ ] Repository on GitHub shows your files.

After that, you can follow **DEPLOY.md** from “Create a production database (Neon)” and connect this GitHub repo to Vercel.
