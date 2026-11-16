# TikTok scraper for Localnet

Reads `tiktok.com` pages for Localnet, a browser extension that is a personal search engine.
Localnet pulls it from here the first time it scrapes such a page, through the
[localnet-scrapers](https://github.com/opowell/localnet-scrapers) scraper source.

- `source.json`: what Localnet reads to know the scraper: its name, the URLs it reads, how the site is searched, the file to run, and that Read plays its videos in TikTok's own player (`/player/v1/<id>`, `"embed": true`).
- `tiktok.js`: the parser. It is injected into the scraped page after Localnet's DOM helpers (content-scripts/utils/dom.js) and defines `window.__dynamicParser`.
- `tiktok.test.ts`: its unit tests, run from a Localnet checkout (`pnpm parsers pull`, then `pnpm test parsers/localnet-scraper-tiktok`).
- `saved-pages/` (not in git): real pages saved from the site, which Localnet's `e2e/saved-pages.test.ts` scrapes. See Localnet's README.
  TikTok's pages are drawn by scripts, so they are saved from a browser (`pnpm saved-pages snippet`).

## What it reads

The scraper reads what TikTok's server writes for its app (`__UNIVERSAL_DATA_FOR_REHYDRATION__`), through `videoPage`
in `content-scripts/utils/dom.js` for videos.

- A video (`/@nasa/video/7708867568920038669`) reads as its caption's first line (cut at 100 characters), then TikTok's
  player for it (`https://www.tiktok.com/player/v1/<id>`, which Read plays in a frame) with its cover, headed by its
  author, then its caption. Its details are its author, hashtags, minutes, views, published day, likes, comments,
  shares and sound. It links with weight 1 to its author and with 0.5 to its hashtags' pages (`/tag/…`). TikTok's
  player may refuse a video for its first hours.
- A profile (`/@nasa`) reads as its name and handle and its bio, and is a listing of the videos it shows. Its details
  are its followers, likes and videos.
- Any other page (a hashtag, `/tag/…`; a search; Explore) is a listing of the videos it shows. The page draws them with
  scripts, so they are waited for, up to 5 seconds.
