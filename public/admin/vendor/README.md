# Vendored Admin Dependencies

Self-hosted copies of the third-party scripts used by the Decap CMS admin page
(`public/admin/index.html`). Vendoring removes the runtime dependency on
jsDelivr / identity.netlify.com CDNs (availability, China-mainland blockability,
and unversioned floating references).

| File | Version | Original URL | Size |
|---|---|---|---|
| `decap-cms@3.16.0.js` | 3.16.0 (exact) | `https://cdn.jsdelivr.net/npm/decap-cms@3.16.0/dist/decap-cms.js` | ~5.1 MB |
| `bibtex-parse@0.0.24.js` | 0.0.24 (exact) | `https://cdn.jsdelivr.net/npm/bibtex-parse-js@0.0.24/bibtexParse.js` | ~11 KB |
| `netlify-identity-widget.js` | unversioned upstream — snapshot taken 2026-09-04 | `https://identity.netlify.com/v1/netlify-identity-widget.js` | ~235 KB |

## Provenance note

`decap-cms@3.16.0.js` is byte-identical to what the previous floating reference
`decap-cms@^3.0.0` was resolving to on the vendoring date, so switching to the
local copy was an imperceptible, no-behavior-change deploy.

## How to upgrade

1. Check the release notes: https://github.com/decaporg/decap-cms/releases
2. Download the new exact version, e.g.:
   `curl -sL -o "public/admin/vendor/decap-cms@X.Y.Z.js" "https://cdn.jsdelivr.net/npm/decap-cms@X.Y.Z/dist/decap-cms.js"`
3. Update the `<script src>` in `public/admin/index.html` (keep the version in the filename).
4. Test the full admin flow locally (`npm run dev` → `http://localhost:5173/admin/`),
   including the BibTeX import widget and a save via the editorial workflow.
5. Remove the old file, update this README, commit.

## Related cleanup (not yet done)

- The main site `index.html` still loads the Netlify Identity widget from
  `identity.netlify.com` (used only for the post-login redirect). It can switch
  to `/admin/vendor/netlify-identity-widget.js` — or be removed entirely if the
  admin ever migrates away from Netlify Identity.
- If the Sveltia CMS trial (`try-sveltia` branch) is adopted, `decap-cms@3.16.0.js`
  and `netlify-identity-widget.js` can be deleted from this directory.
