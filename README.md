# ACC & Associates

Marketing site for a construction consulting firm. Server-rendered, no framework beyond Express + Nunjucks, vanilla CSS/JS. All copy lives in `content/*.json`.

## Run

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

Override the port with `PORT=4000 npm start`.

`npm run dev` runs Node's `--watch` mode for auto-reload during development.

## Requirements

Node 20 or newer.

## File layout

```
server.js                 Express app, routes, /enquiry handler
package.json

content/                  All copy — edit here, never in the templates
  site.json                 Firm name, nav, offices, ABN, email
  home.json                 Hero, programme chart data, proof stats, engage steps
  services.json             The six services in full
  projects.json             Six case studies with outcomes
  about.json                Why the firm exists, four people, governance
  contact.json              Project type / stage dropdowns for the form

views/                    Nunjucks templates
  layout.njk                Base HTML shell
  home.njk / services.njk / projects.njk / about.njk / contact.njk / thanks.njk
  partials/
    head.njk                Meta, preload hints, stylesheet link
    nav.njk                 Sticky primary navigation
    footer.njk              Offices, direct contacts, site links
  macros/
    programme.njk           The signature Gantt/programme chart macro

public/                   Static assets served at the site root
  css/styles.css            Single stylesheet — tokens at the top
  js/main.js                Tiny IntersectionObserver-based scroll reveals
  fonts/                    Self-hosted variable woff2s (Fraunces, Inter Tight, JetBrains Mono)
```

## Editing content

- Text only: change values in `content/*.json` and save. No restart needed if `NODE_ENV` is not `production` — templates are re-read each request.
- New service or case study: append a new object to the `items` array in the relevant JSON file. Templates iterate; no template edits needed.
- Change the firm name, ABN, tagline, or office details: `content/site.json`.
- Change the hero programme chart phases or dates: `content/home.json` → `hero.programme`. Values are percentages of the total programme width.

## The `/enquiry` route

`POST /enquiry` accepts a URL-encoded form. Fields:

- `project_type`, `stage`, `message`, `name`, `email` — required
- `company`, `phone` — optional
- `website` — honeypot; any non-empty submission is silently accepted with no logging

Server-side validation returns the form with error messages when a submission is invalid. Rate-limited to 5 submissions per IP per 10 minutes via `express-rate-limit`. Successful submissions log a single JSON line to `stdout` (no email provider is wired up).

## Design tokens

Everything derives from the tokens at the top of `public/css/styles.css`:

- `--ink #0E1B2C` — primary text and dark surfaces
- `--blueprint #1F3A5F` — reserved secondary blue
- `--corten #6A2E17` — signature accent
- `--trace #F2F1EC` — page background
- `--site #B8B2A6` — connective grey

Fonts: **Fraunces** (display serif), **Inter Tight** (body), **JetBrains Mono** (data, metadata, reference codes). All self-hosted variable woff2 files under `public/fonts/`, preloaded from `views/partials/head.njk`, `font-display: swap`.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`, `article`, `section`, `figure`.
- Skip link, visible focus (2px Corten outline), keyboard nav respected.
- `prefers-reduced-motion` disables the programme-bar draw and scroll reveals.
- Colour contrast: Ink on Trace ≥ 14:1, Corten on Trace ≥ 7:1.

## Notes

- No build step. No bundler. No transpiler.
- Templates are re-read from disk on every request in development for edit-and-refresh; set `NODE_ENV=production` to enable Nunjucks' template cache.
