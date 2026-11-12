# Portfolio builder proxy

A stateless pass-through for GitHub Device Flow, used by the "Build Free Portfolio website" wizard.
It forwards two requests to GitHub, adds the CORS header, and stores nothing and logs nothing.

Endpoints:
- POST /api/device-code
- POST /api/access-token

Deploy: create a new Vercel project from this folder (Root Directory = `github-proxy`). No environment variables needed.
Then copy the project URL (for example `https://dishaint-builder-proxy.vercel.app`) into `CONFIG.proxyBase` in
`public_html/assets/js/portfolio-builder.js` as `https://dishaint-builder-proxy.vercel.app/api`.
