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
const env = nunjucks.configure(join(__dirname, "views"), {
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

// Common locals
app.use((req, res, next) => {
  res.locals.site = content.site;
  res.locals.services = content.services;
  res.locals.year = new Date().getFullYear();
  res.locals.current_path = req.path;
  next();
});

// -------- Pages --------
app.get("/", (req, res) => {
  res.render("home.njk", {
    page_id: "home",
    meta: content.home.meta,
    home: content.home,
  });
});

app.get("/services", (req, res) => {
  res.render("services.njk", {
    page_id: "services",
    meta: content.services.meta,
    services: content.services,
  });
});

app.get("/projects", (req, res) => {
  res.render("projects.njk", {
    page_id: "projects",
    meta: content.projects.meta,
    projects: content.projects,
  });
});

app.get("/about", (req, res) => {
  res.render("about.njk", {
    page_id: "about",
    meta: content.about.meta,
    about: content.about,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact.njk", {
    page_id: "contact",
    meta: content.contact.meta,
    contact: content.contact,
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

  // Silent drop for bots that filled the honeypot.
  if (honeypot) {
    return res.redirect(303, "/contact/thanks?ref=" + Date.now().toString(36).toUpperCase());
  }

  const errors = [];
  if (!values.project_type) errors.push("Choose a project type.");
  if (!values.stage)        errors.push("Choose a project stage.");
  if (!values.message || values.message.length < 20) errors.push("A short description helps — at least 20 characters.");
  if (values.message.length > 4000) errors.push("Message is too long (4000 char max).");
  if (!values.name)         errors.push("Add your name.");
  if (!values.email || !isValidEmail(values.email)) errors.push("A valid email address is needed for the reply.");

  if (errors.length) {
    return res.status(400).render("contact.njk", {
      page_id: "contact",
      meta: content.contact.meta,
      contact: content.contact,
      errors,
      values,
    });
  }

  const ref = Date.now().toString(36).toUpperCase();
  const log = {
    at: new Date().toISOString(),
    ref,
    ip: req.ip,
    ...values,
  };
  console.log("[ENQUIRY]", JSON.stringify(log));

  res.redirect(303, "/contact/thanks?ref=" + ref);
});

app.get("/contact/thanks", (req, res) => {
  const ref = t(req.query.ref) || "—";
  res.render("thanks.njk", {
    page_id: "thanks",
    meta: {
      title: "Enquiry received — ACC & Associates",
      description: "Your enquiry has been received. We will be in touch within one business day.",
    },
    ref,
  });
});

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
