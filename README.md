# Copperas Cove Money Trail

Static, dependency-free public-records research site for tracking Copperas Cove municipal money and infrastructure.

## Files
- `index.html` – site structure
- `styles.css` – responsive design
- `data.js` – research records and timeline seed data
- `app.js` – search/filter UI

## Deploy
Upload the folder to GitHub and deploy directly on Vercel, Cloudflare Pages, GitHub Pages or any static host. No build step is required.

## Data model
Add records to `window.COVE_RECORDS` with:
`category`, `year`, `title`, `summary`, `source`, `status`.

The research rule is simple: if public money touches it, track the source, amount, recipient, purpose, amendments and result.
