# From Local App to Live Website

**A plain-English walkthrough of how we took this app from "running on one
person's laptop" to "a real website anyone can visit," and how to do the
same thing for another project.**

You don't need any prior experience with servers, code, or the black-and-white
typing screen ("terminal") to follow this. Every technical word is explained
the first time it shows up. This guide uses our actual project as the
worked example: we used **GitHub** to store the code and run automation,
and **Hostinger** to rent the server (VPS). Any other server provider
(DigitalOcean, Linode, AWS, etc.) works the same way once you're logged
into it, so the steps below still apply if you chose a different one.
Wherever a value is specific to us (server address, passwords, website
address), it's replaced with a placeholder like `YOUR_DOMAIN.com`, swap
that for your own.

---

## Before we start: five words you'll see everywhere

You don't need to memorize these, just skim once. We'll remind you as we go.

- **Terminal**: a text-only window where you type commands instead of
  clicking buttons. It looks intimidating but it's really just a very
  precise way of telling a computer what to do, one line at a time.
- **Server / VPS**: a computer that isn't yours, sitting in a data center
  somewhere, that stays turned on 24/7 so your website can too. "VPS" stands
  for Virtual Private Server, one slice of a much bigger computer that
  Hostinger (or any similar company) rents out to you. This is the thing
  your website actually lives on.
- **Docker / container**: a way of packaging an app together with
  everything it needs to run (the right version of its programming
  language, its libraries, its settings) into one self-contained box called
  a "container." The point: it runs identically on your laptop, your
  teammate's laptop, and the server. No more "well it worked on my
  machine."
- **Domain**: the human-readable web address people type, like
  `example.com`, instead of a string of numbers.
- **GitHub / CI/CD**: GitHub stores your project's code and its history of
  changes. "CI/CD" is an automated robot assistant: every time you save new
  code, it automatically double-checks the code is healthy, and (if you set
  it up) automatically updates the live website to match. No manual
  copying of files required.

---

## Part 1: Get the app running on your own computer first

Before anything touches the internet, prove the app works locally. This is
the cheapest, fastest place to catch mistakes.

1. Install **Docker Desktop** (a free program, search "Docker Desktop
   download" for your operating system, install it, and restart your
   computer if it asks). This is what lets your computer run "containers."
2. Install **Node.js** (the programming language runtime this app is built
   on) and **Git** (the tool that downloads/tracks the project's code) if
   they aren't already on your machine.
3. Open a terminal in the project folder and run:

   ```bash
   docker compose up -d postgres
   ```

   In plain English: "start a small database, running inside a container,
   just for my own testing." The `-d` means "run it in the background so I
   can keep using this terminal."
4. Install the project's dependencies and start it:

   ```bash
   npm install
   npm run migrate:dev
   npm run db:seed
   npm run dev
   ```

   - `npm install` downloads all the code libraries the project depends on.
   - `migrate:dev` sets up the database's tables and structure.
   - `db:seed` fills it with some sample/test data so the app isn't empty.
   - `npm run dev` actually starts the app.
5. Open a web browser to `http://localhost:3000`. "localhost" means "this
   computer," so this is you looking at the app running on your own
   machine, not the internet yet.

If this works, you have a known-good starting point. Everything after this
is about making that same thing run somewhere the whole internet can reach.

---

## Part 2: Package the app into a container ("Dockerize" it)

A **Dockerfile** is a recipe: a text file listing the exact steps to build
your app into a container. Ours does roughly this, in order:

1. Start from a small, official base image (a pre-made container with just
   the programming language installed, nothing else).
2. Install the project's dependencies.
3. Build the app for production (an optimized, faster version than the
   one you run while developing).
4. Copy just the finished, built result into a clean, minimal final
   container, leaving behind all the temporary build tools, so the final
   package is as small and secure as possible.

You don't need to write this file from scratch, it already exists in the
project (`Dockerfile`). The important habit: **whenever you're not sure a
change will work on the real server, build and run the container locally
first**:

```bash
docker build -t myapp:test .
docker run -p 3000:3000 myapp:test
```

`-t myapp:test` just names the container so you can refer to it later.
`-p 3000:3000` connects port 3000 inside the container to port 3000 on your
computer, so `http://localhost:3000` reaches it.

**A real bug we caught this way**: our app's build succeeded on a
developer's laptop but failed inside the container, because the laptop had
a configuration file (`.env`) present that the container correctly didn't
have (secrets shouldn't be baked into a container image). Testing in a real
container, not just trusting "it worked for me," is what caught it before
it reached a real server.

---

## Part 3: Set up an automatic safety net (CI)

**CI** (Continuous Integration) is a robot that watches your GitHub project
and, every time someone saves new code, automatically:

- Checks the code follows style rules (**lint**)
- Checks for type errors, mismatched data, like trying to add a word to a
  number (**typecheck**)
- Confirms the database setup instructions actually work (**migration
  check**)
- Builds the whole app, the same way the real server will, to catch
  build-breaking mistakes early

This lives in a file at `.github/workflows/ci.yml` in our project, and
GitHub runs it automatically. You don't have to remember to do it yourself.
Think of it as a spell-checker for code that also checks whether the
plumbing actually connects.

---

## Part 4: Rent a server (VPS) and connect to it

1. Buy a VPS. We used **Hostinger**; any provider works the same way
   (DigitalOcean, Linode, AWS, etc.), running **Ubuntu** (a free, very
   common operating system for servers). You'll get an **IP address** (a
   string of numbers like `123.45.67.89` that uniquely identifies your
   server on the internet) and a password, or a way to generate a secure
   key, to log in. Hostinger's dashboard shows this on your VPS's overview
   page, along with a built-in browser terminal if you'd rather not install
   anything locally first.
2. Connect to it using **SSH**, a secure remote-control connection, like
   Remote Desktop but text-only. From a terminal on your own computer:

   ```bash
   ssh root@YOUR_VPS_IP
   ```

   The first time, it'll ask to confirm you trust this server, type `yes`.
   Then it asks for your password (or, if you set up a key, it just lets
   you in automatically). Once connected, everything you type runs on the
   *server*, not your own computer, even though it looks like the same
   terminal window.

3. **Install Docker on the server** (the same program from Part 1, just on
   the server instead of your laptop). The official Docker installation
   instructions have a copy-paste script for Ubuntu, search "install
   Docker Engine on Ubuntu."

---

## Part 5: Get the app's code onto the server and run it

1. On the server, download a copy of the project's code straight from
   GitHub:

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git myapp
   cd myapp
   ```

2. The project needs some settings that shouldn't be stored in the code
   itself, like API keys, database passwords, and similar secrets. These
   live in **environment files** (`.env`-style files) that you create
   directly on the server and never commit to GitHub. Two files, both
   created by hand with a text editor (`nano filename` opens a simple
   in-terminal text editor, type your content, then `Ctrl+O`, Enter,
   `Ctrl+X` to save and exit):
   - One with build-time settings (database password, a couple of public
     configuration values, which port the app should use)
   - One with the app's runtime secrets (API keys for whichever outside
     services the app talks to)

   **A real mistake we hit**: one of these values was a randomly-generated
   password containing characters like `+`, `/`, and `=`. Those characters
   have special meaning inside a database connection address and broke
   everything with a confusing error. Lesson: when generating a random
   password for this kind of use, prefer a generator that only produces
   plain letters and numbers (a hexadecimal generator), not one that can
   output symbols. In our project, that's `openssl rand -hex 24` instead
   of `openssl rand -base64 24`.

3. Start everything, using the same commands we actually ran on our server:

   ```bash
   docker compose -f docker-compose.vps.yml --profile tools run --rm migrate
   docker compose -f docker-compose.vps.yml up -d --build
   ```

   The first line sets up the database's tables (same idea as
   `migrate:dev` earlier, just pointed at the real server database). The
   second line builds the container and starts it running, in the
   background (`-d`), so it keeps running even after you close the
   terminal.

4. Check it worked:

   ```bash
   docker compose -f docker-compose.vps.yml ps
   ```

   This lists what's running and whether it's healthy. At this point the
   app is reachable at `http://YOUR_VPS_IP:YOUR_CHOSEN_PORT`, a working
   website, just not yet at a friendly web address, and not yet secure
   (`http`, not `https`).

---

## Part 6: Give it a real address and make it secure (domain + HTTPS)

**HTTPS** (the padlock icon in a browser) means traffic between visitors
and your server is encrypted, nobody in between can read or tamper with
it. Getting this requires a **certificate**, a small file proving "this
server really is who it claims to be" for a specific domain name. These are
issued by a trusted authority (we used the free, automated **Let's
Encrypt** service) and expire periodically, needing automatic renewal.

1. **Buy a domain** (from Namecheap, GoDaddy, Google Domains, Hostinger's
   own domain service, or similar) if you don't have one. This is a
   separate purchase from the VPS.
2. **Point the domain at your server**: in your domain provider's control
   panel, add an **A record**. Think of it as a phonebook entry that says
   "when someone looks up `YOUR_DOMAIN.com`, send them to `YOUR_VPS_IP`."
   This can take a few minutes to a few hours to take effect worldwide
   (called "DNS propagation").
3. **Run a reverse proxy**. This is a piece of software that sits in front
   of your app and handles two jobs: (a) it's the one thing listening on
   the standard "web" ports (80 for `http`, 443 for `https`) and forwards
   real traffic to your app's container behind the scenes, and (b) it
   automatically requests and renews the HTTPS certificate for you. We
   used **Traefik**; **Caddy** and **Nginx** are common alternatives. If
   your server already runs a reverse proxy for other things (ours did:
   this same Hostinger VPS also hosts an unrelated automation tool), reuse
   it rather than running a second one. Two programs can't both listen on
   the same port.
4. Configure the reverse proxy to route your domain to your app's
   container. This is usually a few lines of configuration ("labels," in
   Docker terms) telling it: "when a request comes in for
   `YOUR_DOMAIN.com`, send it to this specific container, on this specific
   internal port, and get it an HTTPS certificate automatically."

   **A real bug we hit here, worth knowing about**: our app's container was
   connected to two separate internal networks at once (one to reach its
   database, one to reach the reverse proxy). The reverse proxy picked the
   *wrong* one when deciding where to send traffic, so it could complete
   the secure handshake (the padlock worked!) but then the actual page
   request just hung forever with no response and no error message
   anywhere. The fix was a single extra configuration line explicitly
   telling the reverse proxy which network to use (`traefik.docker.network`
   in Traefik's case). If you ever see "HTTPS connects fine, but the page
   never loads, with no errors in any log," check for this exact
   situation.

Once DNS has propagated and the reverse proxy is configured, visiting
`https://YOUR_DOMAIN.com` in a browser should show your app, with a padlock
icon, and both the plain `http://YOUR_VPS_IP:PORT` and the new
`https://YOUR_DOMAIN.com` address work at the same time (dropping the raw
IP/port access later is optional tidiness, not required).

---

## Part 7: Automate future updates (CI/CD)

By this point, updating the live site means: make a code change, connect
to the server, download the new code, and rebuild, all by hand, every
time. The last piece automates that.

**GitHub Actions** can be given permission to log into your server itself
and run those same update commands automatically, every time you save new
code. To let it do that safely:

1. **Create a dedicated login key just for this purpose**, not your
   personal password, a separate key that only allows automated deploys.
   Generate it directly on the server (this matters: copying a multi-line
   security key through a chat window or an email can silently corrupt it;
   typing the generation command directly where it'll be used avoids that
   entirely):

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
   cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
   ```

   This creates a matched pair: a "public" half (safe to share, just
   proves identity) which you just added to the server's own list of
   trusted keys, and a "private" half (must stay secret) which GitHub will
   use to prove it's allowed in.

2. **Give GitHub the private half, safely**. GitHub Actions has a
   "Secrets" feature (in your project's page on GitHub: Settings > Secrets
   and variables > Actions) built exactly for this. Once saved, nobody
   (including you) can view the value again, only overwrite it, and
   GitHub automatically hides it if it ever accidentally gets printed
   anywhere.

   **A real problem we hit repeatedly**: pasting a multi-line security key
   (the kind that starts with `-----BEGIN...-----` and spans several
   lines) into GitHub's secret box kept getting silently corrupted, a line
   break lost here, an invisible character added there, and every
   automated deploy failed with a cryptic "key not found" error, even
   though the key worked perfectly when used directly. If you hit this:
   convert the key to a single line of plain letters/numbers first
   (`base64 -w0 ~/.ssh/deploy_key` on the server prints this), paste
   *that* instead, and have the automation convert it back before using it.
   A single line with no special characters is far less likely to get
   mangled in transit than a multi-line block with special marker lines.
   This is exactly what fixed it for us, after two attempts at pasting the
   raw key kept failing.

3. **Write the automation steps** (a file at
   `.github/workflows/deploy-vps.yml`, similar to the CI checks file from
   Part 3, but this one actually logs into the server over SSH and runs
   the update commands from Part 5, step 3, automatically). Ours looks
   roughly like this in plain English: decode the login key, connect to
   the server, download the newest code, update the database, rebuild and
   restart the app, then check the live website actually responds.

From this point on: save code, GitHub automatically checks it's healthy,
GitHub automatically logs into the server, pulls the new code, updates
the database if needed, rebuilds and restarts the app. No manual server
work needed for routine updates.

---

## Glossary (quick reference)

| Term | Plain-English meaning |
|---|---|
| Terminal | Text window for typing commands instead of clicking |
| Server / VPS | A rented, always-on computer your website lives on (we used Hostinger) |
| IP address | The server's numeric internet address |
| Domain | The human-readable web address (`example.com`) |
| DNS / A record | The "phonebook entry" pointing a domain at an IP address |
| SSH | Secure remote-control connection to a server, via terminal |
| Docker / container | A self-contained, portable package of an app plus everything it needs |
| Dockerfile | The recipe for building a container |
| Reverse proxy | Software that routes incoming web traffic to the right app and handles HTTPS |
| HTTPS / certificate | Encrypted, verified web traffic (the padlock icon) |
| Database migration | Setting up / updating a database's table structure |
| Seed data | Sample data used to test that an app works |
| Environment file / secret | Sensitive settings (passwords, API keys) kept out of the code itself |
| CI (Continuous Integration) | Automated checks that run on every code change (we used GitHub Actions) |
| CD (Continuous Deployment) | Automating the actual update of the live server |
| GitHub Actions | GitHub's built-in automation/robot-assistant feature |

---

## If something breaks: how to think about it

1. **Check the smallest piece first.** Is the database container even
   running? Is the app container running? (`docker compose ps` answers
   both.) Fix the earliest failure in the chain before chasing later
   symptoms.
2. **"It worked on my computer" doesn't mean "it'll work on the server."**
   Different network setup, different files present, different
   permissions. Always verify directly on the real target, not just
   locally.
3. **A connection that "succeeds" but never responds** (like our reverse
   proxy issue) usually means two pieces can technically reach each other
   but are talking to the wrong address entirely. Check exactly which
   internal address each piece is actually using, not just whether they're
   "on the same network" in a loose sense.
4. **Copy-pasting security keys is risky.** Prefer generating a key
   directly where it'll be used, or converting it to a single plain-text
   line, over copying a multi-line block through chat windows, emails, or
   anything that might silently alter whitespace or special characters.
5. **When in doubt, read the actual error message slowly.** Deployment
   errors are often precise about what's wrong; the hard part is usually
   just being patient enough to read past the scary-looking wall of text
   to the one relevant line.
