# WAR Performance Website

A standalone WAR Performance website for athletic training in Boca Raton, Florida. The site includes a Next-compatible app shell and a self-contained HTML page with the page content, styling, media references, navigation, and contact links.

## Requirements

- Node.js 22.13 or newer
- npm

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server. To create a production build and run the checks:

```sh
npm run build
npm test
npm run lint
```

To serve the production build locally, use `npm start`.

## Scripts

- `npm run dev` — start the vinext development server.
- `npm run build` — build the site for the Cloudflare Workers runtime.
- `npm start` — start the built site locally.
- `npm test` — build and verify rendered page metadata, content sections, and link destinations.
- `npm run lint` — run ESLint.
- `npm run package:godaddy -- [output-directory]` — package the site for GoDaddy Node.js Hosting and cPanel. This command installs dependencies in the output package and creates upload archives; it does not publish the site.

## Structure

- `app/` — app shell, metadata, global styles, and ChatGPT sign-in helpers.
- `public/war.html` — full WAR Performance page rendered inside the app shell.
- `public/` — favicon, social preview, and starter static assets.
- `scripts/sync-reference.mjs` — refresh the mirrored page from its configured source, or update the existing local mirror with `--local`.
- `scripts/package-godaddy.mjs` — create standalone GoDaddy deployment packages.
- `deployment/godaddy/` — Node server and build scripts used by those packages.
- `tests/` — rendered-page and link checks.
- `worker/`, `vite.config.ts`, and `.openai/hosting.json` — Cloudflare/vinext runtime integration and hosting configuration.

## Configuration

The main site requires no environment variables for local development. The standalone GoDaddy package optionally accepts `SITE_URL` at build time to generate canonical and absolute social-image URLs; its server listens on the `PORT` supplied by the host. Do not commit credentials or `.env` files.

## Deployment

The main app is configured for the vinext/Cloudflare Workers runtime. The `package:godaddy` command produces separate Node.js Hosting and static cPanel archives. Review the generated deployment README before uploading; deployment and domain changes are separate steps.
