# Mettlestate × Marvel Snap League — v5

A self-hosted, mobile-first league management web app for Marvel Snap. No backend required — runs entirely in the browser, persists to GitHub Pages.

## Data Structure (v5)

```
data/
├── player-data.json              ← All player records
├── index.json                    ← Index of all match-day paths
└── YYYY-MM/
    └── YYYY-MM-DD/
        ├── match-day.json        ← Fixtures + results for that day
        └── match-images/         ← Evidence screenshots
```

## Quick Setup

### 1. GitHub Pages
1. Fork or push this repo to GitHub
2. Go to **Settings → Pages → Deploy from branch → main / root**
3. Your app will be live at `https://{username}.github.io/{repo}/`

### 2. Discord Webhook
1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**
2. Copy the URL
3. Replace `YOUR_DISCORD_WEBHOOK_URL_HERE` in:
   - `js/config.js`
   - `newplayers/index.html`

### 3. GitHub PAT Token
1. **GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained**
2. Required permissions: **Contents** (read + write)
3. Enter in **Admin → GitHub Sync** — never commit the token!

### 4. Gemini OCR (Optional)
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a free API key (1,500 req/day)
3. Enter in **Admin → WhatsApp OCR**

## Scoring

Marvel Snap matches end on a Cube count (1/2/4/8+), not a running goal tally, so points work differently from a football league:

- **Win** = points equal to the Cubes won that match (a 4-Cube win is worth more than a 1-Cube win)
- **Draw** = both players split half the Cubes on the table
- **Loss** = 0 points
- **Forfeit / no-show / auto-forfeit** = recorded as a standard **4–0** Cube win
- **Tiebreaker**: Cube Difference (CD), then Cubes Won (CW)

## File Structure

```
/
├── index.html                    ← Main dashboard
├── newplayers/
│   └── index.html                ← Player self-registration (Marvel Snap rules)
├── data/
│   ├── player-data.json
│   ├── index.json
│   └── YYYY-MM/YYYY-MM-DD/
│       ├── match-day.json
│       └── match-images/
├── css/
│   ├── base.css                  ← Variables, reset, typography
│   ├── layout.css                ← Nav, top bar, sync bar, modals
│   ├── components.css            ← All UI components
│   ├── admin.css                 ← Admin panel, accordions, themes
│   └── animations.css            ← 22 @keyframes
└── js/
    ├── config.js                 ← Constants, SAST utils, SA holidays
    ├── state.js                  ← Global state singleton
    ├── storage.js                ← localStorage abstraction
    ├── github.js                 ← GitHub API (new path system)
    ├── discord.js                ← Discord webhook embeds
    ├── themes.js                 ← 10 themes
    ├── players.js                ← Player CRUD, Cube-weighted stats, render
    ├── fixtures.js                ← Fixture gen, postponements, forfeit
    ├── results.js                ← Cube count logging, evidence, lightbox
    ├── standings.js              ← Leaderboard, podium, exports
    ├── calendar.js               ← Calendar, Mettlestate events, scheduler
    ├── ocr.js                    ← WhatsApp Gemini OCR (Marvel Snap prompt)
    ├── admin.js                  ← Admin panel logic
    └── app.js                    ← Entry point, navigation, init
```

## Themes

10 built-in themes selectable from Admin → Theme:
Godmode · Cyber Blue · Blood Red · Royal Purple · Solar Orange · Arctic · Matrix · Rose Gold · Void · Neon ⚡

## Data Model

### player-data.json
```json
{
  "players": [{ "name": "...", "username": "...", "phone": "...", "played": 0, "wins": 0, "draws": 0, "losses": 0, "points": 0, "gf": 0, "ga": 0, "form": [], "postponements": 20, "suspended": false }],
  "lastUpdated": "ISO"
}
```
`gf`/`ga` store total Cubes won / Cubes lost across the season (labelled CW/CL in the UI). `points` is the Cube-weighted total described above, not a flat win/draw/loss score.

### data/index.json
```json
{
  "matchDays": [{ "date": "2026-04-15", "path": "data/2026-04/2026-04-15/match-day.json" }],
  "lastUpdated": "ISO"
}
```

### data/YYYY-MM/YYYY-MM-DD/match-day.json
```json
{
  "date": "2026-04-15",
  "fixtures": [{ "id": 123, "home": "user1", "away": "user2", "postponedBy": null, "scheduledDate": "2026-04-15" }],
  "results":  [{ "id": 124, "home": "user1", "away": "user2", "result": "home", "homeGoals": 4, "awayGoals": 1, "date": "2026-04-15" }],
  "lastUpdated": "ISO"
}
```
`homeGoals`/`awayGoals` field names are kept from the original engine for compatibility, but represent each player's final **Cube count** for that match.
