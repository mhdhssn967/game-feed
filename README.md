# Game Feed

TikTok-style vertical scrolling PWA that embeds external games via iframes.

## Setup

```bash
npm install
npm run dev
```

## Before deploying as a PWA

Add real icon files to `public/`:
- `favicon.ico`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `apple-touch-icon.png`

Any square PNGs work for local testing; the manifest just needs the files to exist at those paths.

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  App.jsx                     Root wrapper & SW registration
  components/
    GameFeed.jsx               Vertical scroll/snap + preload logic
    GameCard.jsx                Full-screen iframe container
    NavigationArrows.jsx        Up/down chevrons, bottom-left, auto-fade
  data/
    games.js                    List of embedded game URLs
```
