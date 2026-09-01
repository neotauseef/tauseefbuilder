# ACC & Associates — Australia Construction Consultants

Marketing site for **Australia Construction Consultants & Associates Pty Ltd** — a Sydney construction consulting firm. Single scrolling page, server-rendered with Express + Nunjucks, vanilla CSS / JS. All copy lives in `content/*.json` — no code changes needed to reword.

**Tagline:** _The Tool for Success_ · _Building Knowledge. Managing Risk. Delivering Results.™_

## Run locally

```bash
npm install
npm start
```

Then open <http://localhost:3000>. Override the port with `PORT=4000 npm start`. `npm run dev` runs Node's `--watch` mode.

Requires **Node 20 or newer**.

## Extract to `C:\Users\mirta\Desktop\WEBSITE`

The whole project ships as a single ZIP (see the message this file arrived with, or the artifact preview). To use it on Windows:

1. Right-click the ZIP → **Extract All…** → point it at `C:\Users\mirta\Desktop\WEBSITE`.
2. Open a terminal (PowerShell or `cmd`) in that folder.
3. `npm install`
4. `npm start`
5. Browse to <http://localhost:3000>.

## File layout

```
server.js                 Express app, routes, /enquiry handler, /portal + /signin stubs
package.json

content/                  All copy — edit here, never in the templates
  site.json                 Firm name, nav, contact, stats, capability pills
  home.json                 Hero, Command Centre, Methodology (4 pillars), Timeline (10 stages),
                            PERT block, promises, Two Ways to Work, engage intro
  services.json             The nine service lines (C.01 – C.09)
  projects.json             Signature projects (Caltex + others)
  about.json                Team, grouped: Executive / Senior / IT / Design
  contact.json              Contact channels, service dropdown options

views/                    Nunjucks templates
  layout.njk                Base HTML shell
  home.njk                  The single scrolling page — every section on one URL
  stub.njk / thanks.njk / 404.njk
  partials/
    head.njk                Meta, preload hints, stylesheet link
    nav.njk                 Sticky nav — brand + section anchors + Sign in / Client Portal
    footer.njk              Direct contact, site map, region

public/
  css/styles.css            Single stylesheet. Tokens at the top.
  js/main.js                Tiny IntersectionObserver-based scroll reveals
  fonts/                    Self-hosted variable woff2 (Fraunces, Inter Tight, JetBrains Mono)
  favicon.svg               Gradient ACC badge
```

## Routes

- `GET  /`                       — the one-page site
- `GET  /services` → 301 `/#capabilities`
- `GET  /projects` → 301 `/#projects`
- `GET  /about`    → 301 `/#team`
- `GET  /contact`  → 301 `/#engage`
- `GET  /portal`   — Client Portal holding page
- `GET  /signin`   — Sign-in holding page
- `POST /enquiry`  — form handler (rate-limited, honeypot)
- `GET  /thanks`   — post-submit confirmation

## Content sections on the home page

1. **Hero** — headline + lede + CTAs + stats (25+ / $400M+ / 120+)
2. **Brand band** — ACC & Associates logo, pillars, motto
3. **Command Centre™** — real-time visibility KPIs
4. **01 / Methodology** — 4 pillars: Contract · Legislation · Commercial · Evidence
5. **02 / Capabilities** — nine service lines
6. **03 / Timeline** — ten stages across Plan / Prepare / Execute / Deliver & Close, plus PERT and the four promises
7. **05 / Team** — Executive, Senior, IT, Design & Technical
8. **06 / Signature Projects** — Caltex Refinery & Terminal Works, etc.
9. **Networks** — Partner (A$700) + Subcontractor (A$200/3mo)
10. **07 / Engage** — contact channels + enquiry form

## Design tokens (top of `public/css/styles.css`)

- `--ink       #0A1420` — near-black headings/body
- `--paper     #FFFFFF` — page background
- `--brass     #C69233` — signature gold accent (logo, dividers)
- `--red       #D62828` — section marks (`// LABEL`), icon panels, bullet dots
- `--navy      #0B2E4F` — deep navy for the ACC badge
- `--mute      #A9A69B` — the muted word in the hero (_"The contract"_)

**Typography.** Inter Tight is the primary sans with weights 500 (body) → 800 (headings) → 900 (brand marks and pricing). JetBrains Mono handles all uppercase labels, marks and buttons. Fraunces provides the italic motto in the footer.

## `/enquiry` route

`POST /enquiry` accepts a URL-encoded form. Fields:

- `project_type` (service interest), `message`, `name`, `email` — required
- `company`, `stage`, `phone` — optional
- `website` — honeypot; any non-empty submission is silently accepted with no logging

Server-side validation returns the form with error messages when invalid. Rate-limited to 5 submissions per IP per 10 minutes. Successful submissions log a single JSON line to `stdout` (no email provider is wired up — swap in nodemailer / SES / Postmark when you're ready to receive live enquiries).

## Deploying on Crazy Domains

### Shared hosting (cPanel — Setup Node.js App)

1. In cPanel, open **Git Version Control** and clone this repo (URL, branch `main`).
2. Open **Setup Node.js App** → **Create Application**:
   - Node.js version: `20.x` (or newer)
   - Application mode: `Production`
   - Application root: the folder you cloned into
   - Application URL: your domain (or subdomain)
   - Application startup file: `server.js`
   - Environment variables: `NODE_ENV=production` (cPanel sets `PORT` for you; `server.js` already reads `process.env.PORT`)
3. Click **Run NPM Install**, then **Start App**.
4. Redeploys: `git pull` in cPanel's Git Version Control, then **Restart** in Setup Node.js App.

### VPS / Cloud hosting (SSH)

```bash
git clone <this repo> && cd tauseefbuilder
npm ci --omit=dev
NODE_ENV=production PORT=3000 node server.js
```

Put it behind the plan's Apache/Nginx as a reverse proxy to `127.0.0.1:3000`, and run it under a process manager (`pm2 start server.js --name acc && pm2 save && pm2 startup`).

### Domain

Point the A record for the domain (or its subdomain) at the hosting server's IP in Crazy Domains **Domain Manager → DNS**. Shared cPanel plans wire this automatically once the domain is added as an addon or primary domain.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`, `article`, `section`, `figure`.
- Skip link, visible focus, keyboard nav.
- `prefers-reduced-motion` disables scroll behaviour and transitions.
- Colour contrast: Ink on Paper ≥ 15:1, Brass on Ink ≥ 5:1.

## Notes

- No build step. No bundler. No transpiler.
- Templates are re-read from disk on every request in development; set `NODE_ENV=production` to enable Nunjucks' template cache.
