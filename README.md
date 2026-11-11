# Sai Teja & Nishma - Wedding Invitation Website

A static website (plain HTML, CSS and JavaScript). No build step and no server needed.

## Files
- `index.html` - page content, couple illustration, QR code
- `css/style.css` - all styling and animations
- `js/main.js` - opening sequence, petals, scratch card, countdown, sound
- `assets/qr-location.svg` - the venue QR code (also embedded in index.html)
- `favicon.svg`, `og-image.png` - tab icon and link-preview image

## Deploy (pick one, all free)
**Netlify (easiest):** go to app.netlify.com/drop and drag this whole folder onto the page. You get a link immediately.
**Vercel:** install the CLI (`npm i -g vercel`), run `vercel` inside this folder.
**GitHub Pages:** push this folder to a repository, then Settings > Pages > deploy from the main branch.
**Cloudflare Pages:** create a project, choose "Direct upload", and upload this folder.

## Test on your computer
Open `index.html` in a browser. Or run `python3 -m http.server 8000` in this folder and visit http://localhost:8000.
An internet connection is needed for the Google Fonts.

## WhatsApp link preview
After deploying, open `index.html` and change the `og:image` line to your full address, for example
`https://yourname.netlify.app/og-image.png`. Then redeploy.

## Editing details
Names, date, venue and family names are plain text in `index.html`.
The countdown target is in `js/main.js` (search for `2026-11-18T11:30:00+05:30`).
If the Maps link changes, regenerate the QR from the new link and replace the QR `<svg>` in `index.html`.
