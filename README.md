# CipherSprint ⌨️⚡

**Test Your Typing Speed with CipherSprint!**

## 🚀 Overview
CipherSprint is a **real-time typing speed test** platform designed to help users enhance their typing speed and accuracy. With an interactive UI and real-time performance tracking, users can measure their words per minute (WPM), accuracy, and progress over time.

🔥 **Fast & Responsive** | 🎯 **Accurate Stats** | 📊 **Performance Insights**

## 🛠 Tech Stack
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
