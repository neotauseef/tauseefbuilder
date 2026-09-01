import express from "express";
import nunjucks from "nunjucks";
import rateLimit from "express-rate-limit";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

// -------- Content --------
const loadJson = (p) => JSON.parse(readFileSync(join(__dirname, "content", p), "utf8"));
const content = {
  site:     loadJson("site.json"),
  home:     loadJson("home.json"),
  services: loadJson("services.json"),
  projects: loadJson("projects.json"),
  about:    loadJson("about.json"),
  contact:  loadJson("contact.json"),
};

// -------- Templating --------
nunjucks.configure(join(__dirname, "views"), {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== "production",
});
app.set("view engine", "njk");

// -------- Middleware --------
app.use(express.urlencoded({ extended: false, limit: "64kb" }));
app.use(express.static(join(__dirname, "public"), {
  maxAge: "7d",
  setHeaders(res, path) {
    if (path.endsWith(".woff2")) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
}));

const ASSET_VERSION = Date.now().toString(36);
app.use((req, res, next) => {
  res.locals.site = content.site;
  res.locals.services = content.services;
  res.locals.projects = content.projects;
  res.locals.about = content.about;
  res.locals.contact = content.contact;
  res.locals.year = new Date().getFullYear();
  res.locals.current_path = req.path;
  res.locals.asset_v = ASSET_VERSION;
  next();
});

// -------- One-page home --------
const renderHome = (req, res, extras = {}) => {
  res.render("home.njk", {
    page_id: "home",
    meta: content.home.meta,
    home: content.home,
    ...extras,
  });
};

app.get("/", (req, res) => renderHome(req, res));

// Legacy multi-page routes → keep them, but each just renders the home page.
// (The nav anchors let a visitor land in the right section.)
app.get("/services", (req, res) => res.redirect(301, "/#capabilities"));
app.get("/projects", (req, res) => res.redirect(301, "/#projects"));
app.get("/about",    (req, res) => res.redirect(301, "/#team"));
app.get("/contact",  (req, res) => res.redirect(301, "/#engage"));

// Portal + Sign-in placeholders (the target site links to them; we serve a
// simple holding page so nothing 404s.)
app.get("/portal", (req, res) => {
  res.render("stub.njk", {
    page_id: "portal",
    meta: { title: "Client Portal — ACC & Associates", description: "ACC Client Portal — coming soon." },
    stub: {
      eyebrow: "// CLIENT PORTAL",
      title: "Command Centre access.",
      body: "The ACC Client Portal is where retained clients see their live project dashboard, documents and evidence trail. Access is issued by ACC on engagement.",
      cta: { label: "Request access", href: "/#engage" },
    },
  });
});
app.get("/signin", (req, res) => {
  res.render("stub.njk", {
    page_id: "signin",
    meta: { title: "Sign In — ACC & Associates", description: "Sign in to the ACC Client Portal." },
    stub: {
      eyebrow: "// SIGN IN",
      title: "Sign in to the Client Portal.",
      body: "Enter the credentials issued with your engagement letter. If you've lost them, request a reset below.",
      cta: { label: "Contact ACC", href: "/#engage" },
    },
  });
});

// -------- Enquiry --------
const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many enquiries from this IP. Please try again shortly.",
});
const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const t = (v) => (typeof v === "string" ? v.trim() : "");

app.post("/enquiry", enquiryLimiter, (req, res) => {
  const values = {
    project_type: t(req.body.project_type),
    stage:        t(req.body.stage),
    message:      t(req.body.message),
    name:         t(req.body.name),
    company:      t(req.body.company),
    email:        t(req.body.email),
    phone:        t(req.body.phone),
  };
  const honeypot = t(req.body.website);
  if (honeypot) return res.redirect(303, "/thanks?ref=" + Date.now().toString(36).toUpperCase());

  const errors = [];
  if (!values.project_type) errors.push("Choose a service interest.");
  if (!values.message || values.message.length < 20) errors.push("A short brief helps — at least 20 characters.");
  if (values.message.length > 4000) errors.push("Message is too long (4000 char max).");
  if (!values.name)  errors.push("Add your name.");
  if (!values.email || !isValidEmail(values.email)) errors.push("A valid email address is needed for the reply.");

  if (errors.length) return res.status(400).render("home.njk", {
    page_id: "home", meta: content.home.meta, home: content.home,
    errors, values,
  });

  const ref = Date.now().toString(36).toUpperCase();
  console.log("[ENQUIRY]", JSON.stringify({ at: new Date().toISOString(), ref, ip: req.ip, ...values }));
  res.redirect(303, "/thanks?ref=" + ref);
});

app.get("/thanks", (req, res) => {
  res.render("thanks.njk", {
    page_id: "thanks",
    meta: { title: "Enquiry received — ACC & Associates", description: "Your enquiry has been received. We will be in touch within one business day." },
    ref: t(req.query.ref) || "—",
  });
});
// Old thanks URL keeps working
app.get("/contact/thanks", (req, res) => res.redirect(301, "/thanks?ref=" + (t(req.query.ref) || "")));

// -------- 404 --------
app.use((req, res) => {
  res.status(404).render("404.njk", {
    page_id: "notfound",
    meta: { title: "Not found — ACC & Associates", description: "The page you were looking for cannot be found." },
  });
});

app.listen(port, () => {
  console.log(`ACC & Associates → http://localhost:${port}`);
});
