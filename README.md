# Savings Squads 🏆

> **Social group savings challenges — save together, win together.**

Built for the **Zolve Fintech Hackathon** to solve the engagement crisis in financial apps through gamification and social accountability.

---

## Problem Statement

Traditional savings apps are lonely. People set goals, lose motivation, and abandon them within weeks. **Low engagement = low retention = lost users.**

Research shows people are **3× more likely** to stick to a savings goal when they have social accountability. Yet most fintech apps treat saving as a solo activity.

---

## Solution

**Savings Squads** turns saving into a team sport:

- **Create a Squad** with a shared goal (vacation fund, emergency savings, group gift)
- **Invite friends** with a 6-character code — no signup required
- **Log contributions** and watch the progress bar fill in real-time
- **Compete on leaderboards** and react to each other's contributions
- **Celebrate together** with confetti when you hit 100%

---

## Features

| Feature | Description |
|---------|-------------|
| **Squad Creation** | Name, goal, target amount, deadline, auto-generated invite code |
| **Instant Joining** | 6-char invite code, just enter your name — no account needed |
| **Live Progress** | Animated progress bar with real-time Socket.io updates |
| **Contribution Feed** | Timestamped feed, most recent first, with messages |
| **Emoji Reactions** | 🔥 💪 🎉 ❤️ 👏 on each contribution, live across all members |
| **Leaderboard** | Ranked by contribution, crown for top contributor, mini progress bars |
| **Countdown Timer** | Days remaining, urgency pulse when ≤3 days left |
| **Auto-Celebration** | Full-screen confetti burst + personalized message at 100% |
| **Goal Achieved Badge** | Persistent "Goal Achieved!" indicator |
| **Share Invite** | Copy code or full link to clipboard |
| **Member Avatars** | Color-coded initials avatars for each member |
| **Session Persistence** | Rejoins your squad automatically after refresh |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, Tailwind CSS, Vite |
| **Backend** | Node.js, Express |
| **Database** | SQLite via better-sqlite3 (zero setup) |
| **Real-time** | Socket.io (WebSocket) |
| **Confetti** | canvas-confetti |
| **Design** | Glassmorphism, Purple + Teal palette, Space Grotesk + Inter |

---

## Setup & Running

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Start

```bash
# Clone / navigate to project
cd savings-squads

# Install all dependencies
npm install

# Start both server + client (with hot reload)
npm run dev
```

The app opens at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Socket.io**: http://localhost:3001

### Build for Production

```bash
npm run build
NODE_ENV=production node server/index.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/squads` | Create a new squad |
| `GET` | `/api/squads/invite/:code` | Lookup squad by invite code |
| `GET` | `/api/squads/:id` | Get squad with members + contributions |
| `POST` | `/api/squads/:id/join` | Join squad as a member |
| `POST` | `/api/squads/:id/contribute` | Log a contribution |
| `POST` | `/api/contributions/:id/react` | Add emoji reaction |
| `GET` | `/api/squads/:id/leaderboard` | Get ranked leaderboard |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-squad` | Client → Server | `squadId` |
| `contribution-added` | Server → Clients | `{ contribution, squad, member }` |
| `reaction-updated` | Server → Clients | `{ contribution_id, reactions }` |
| `goal-achieved` | Server → Clients | `{ squad }` |

---

## Data Models

```
Squad:        id, name, goal_description, target_amount, current_amount,
              deadline, invite_code, created_at, goal_achieved

Member:       id, squad_id, name, color, joined_at

Contribution: id, squad_id, member_id, member_name, amount, message, created_at

Reaction:     contribution_id, emoji, count
```


---

## Why This Wins

- **Zero friction**: No login, no account, join with a 6-char code
- **Dopamine loop**: React → Leaderboard → Progress → Celebrate
- **Real Zolve synergy**: Integrates naturally with Zolve's group financial features for NRI communities saving together across borders
- **Mobile-first**: Designed for thumb-scrolling, 44px touch targets, responsive

---

*Made for the INFORMS x Zolve Hackathon by the AlphaQuery team*
