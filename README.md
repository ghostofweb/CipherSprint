# CipherSprint ⌨️⚡

**Test Your Typing Speed with CipherSprint!**

## 🚀 Overview
CipherSprint is a **real-time typing speed test** platform designed to help users enhance their typing speed and accuracy. With an interactive UI and real-time performance tracking, users can measure their words per minute (WPM), accuracy, and progress over time.

🔥 **Fast & Responsive** | 🎯 **Accurate Stats** | 📊 **Performance Insights**

## 🛠 Tech Stack
hello world
- **Frontend:** React, Vite, Global CSS, Styled Components
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **State Management:** React Context API
- **Authentication:** JWT-based auth (email/password)
- **Data Visualization:** Chart.js, React-ChartJS-2
- **Other Libraries:** Random-Words, React Select, React Toastify

## 🌍 Features
✅ Real-time **typing speed test** with WPM & accuracy tracking
✅ **User authentication** (signup/login) with JWT
✅ **Leaderboard** to compare your performance with others
✅ **Charts & Stats** to visualize progress over time
✅ **1v1 races**: create a room, invite a friend, and watch each other's caret live
✅ **Quick match and spectators**, side-by-side race replays
✅ **Decrypt**: every new test arrives encrypted and decodes into place (CipherSprint's own Cipher / Cipher Paper themes)
✅ **Command palette** (Ctrl/Cmd+K), shortcuts sheet (?), settings synced to your account
✅ **Keyboard heatmap** of your mistakes and a "practise weak keys" test
✅ **Test replays**, personal-best callouts, live wpm, caps-lock warning
✅ **8 languages**, synthesised key sounds, installable PWA that works offline
✅ **Password reset by email** (Resend), block and report, admin review queue

Screenshots with captions are in [`showcase/`](showcase/README.md).

**New environment variables** (see `backend/.env.example`): `RESEND_API_KEY` and `MAIL_FROM` for reset emails (without them the link is printed to the server console), `ADMIN_USERNAMES` for the reports queue, `TRUST_PROXY` behind a host proxy, and `AUTH_RATE_LIMIT` to override the login limit.
✅ **Custom test settings** (time limits, word count)
✅ **Responsive UI** for desktop & mobile
✅ **Dark mode support**

## 📊 Typing Speed & Accuracy Calculation
### Words Per Minute (WPM):
```
WPM = (Correct Words / Time in Minutes)
```
### Accuracy:
```
Accuracy (%) = [(Correct Characters) / (Correct + Incorrect + Extra + Missed Characters)] * 100
```
### Definitions:
- **Correct Characters:** Typed correctly as per the given text.
- **Incorrect Characters:** Typed incorrectly.
- **Extra Characters:** Typed but not present in the original text.
- **Missed Characters:** Not typed at all from the original text.

## 📁 Project Structure
```
ciphersprint/
├── frontend/   # React + Vite app
└── backend/    # Express + MongoDB API
```

## 🔧 Installation & Setup

Clone the repository:

```bash
git clone https://github.com/your-username/ciphersprint.git
cd ciphersprint
```

Install dependencies for both apps:

```bash
npm run install:all
```

Set up the backend environment file:

```bash
cd backend
cp .env.example .env
# then edit .env and set MONGODB_URI / JWT_SECRET
cd ..
```

The frontend already has a `.env.local` pointing at `http://localhost:5000` for `VITE_API_URL` — adjust if your API runs elsewhere.

Run both apps together in development:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3001
```

Build the frontend for production:

```bash
npm run build
```

## 🏁 Racing

A host creates a race at `/race`, picks the rules, and shares the 6-character code (or invites a friend, who gets a toast with a Join button). Both players type the same text at the same moment.

- **Formats:** `time` (15/30/60/120s, highest wpm wins), `words` (15/30/50/100, first to finish wins), `quote` (short/medium/long, first to finish wins). Punctuation, numbers and word length (any/short/long) apply to time and words.
- **How it is shown:** a lane per racer above the text (a hairline from start to finish with that racer's caret riding it), plus the opponent's caret inside the text with a name tag. The opponent's colour (`--rival`) is derived from the theme's accent, so it works in every theme.
- **Server-authoritative:** the server generates the text once and sends it to both players, times the countdown, and decides the winner. It recomputes wpm and accuracy from the raw counts a client reports and rejects results that a keyboard could not produce.
- **Races do not count toward solo stats, personal bests or the leaderboard.** Finished races are stored in the `Race` collection.
- **Limits:** rooms live in memory, so they are correct for a single Node process only (like presence); a server restart drops live rooms. Scaling out needs the Redis adapter and a shared room store.

Code: `backend/src/race/` (rooms, timing, winner logic), `frontend/src/Hooks/useRace.ts`, `frontend/src/Components/race/`, and the shared contracts in `packages/shared/src`.

## 🎨 Design system & brand assets

- **Tokens** live in `frontend/src/Styles/tokens.css`. They are derived from the seven per-theme colors, so every surface follows every theme. `frontend/src/Utils/themeTokens.ts` also derives contrast-safe text colors (`--muted`, `--accent-text`, `--danger-text`, `--on-accent`) so UI text stays WCAG AA in all themes.
- **Primitives** (Button, IconButton, Input, Tabs, Dialog, Menu, Switch, Skeleton, EmptyState, Segmented) are in `frontend/src/Components/ui/`; the custom icon set is `Components/ui/icons.tsx`.
- **Generated assets** (identicon avatars, empty-state illustrations, the result share card) are in `frontend/src/Components/assets/`.
- **Brand pack** (favicon, PWA/maskable/apple icons, social image) is generated, not hand-exported. After changing the mark, regenerate it with:

```bash
npm i -D playwright && npx playwright install chromium
node scripts/build-brand-assets.mjs
```

## 🌎 Live Website
[Visit CipherSprint](https://ciphersprint.vercel.app/)

---

⌨️ **Start typing faster with CipherSprint!** 🚀
