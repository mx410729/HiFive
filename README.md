# HiFive 🤚

> **Lower the barrier. Make the connection. Meet in person.**

HiFive is a proximity-based social app designed to strengthen real-world connections — not replace them. It removes the anxiety of approaching someone new by using shared interests and physical proximity to facilitate genuine human interaction.

---

## The Problem

Meeting new people is hard. Social media optimizes for follower counts, likes, and online engagement — not real friendships. The decision barrier to introducing yourself to someone nearby is too high, and existing apps do nothing to lower it.

---

## What We're Building

HiFive facilitates two distinct pathways for connection, both designed to end at the same place: **an in-person conversation.**

---

### Connection Method 1: Manual Add

You can manually add someone you're weakly connected to — a classmate, someone you've seen around, a friend of a friend.

**How it works:**
1. You send a friend request to someone
2. They must add you back to initiate a conversation (mutual opt-in)
3. Once matched, an **AI-generated question** is sent to both of you based on your **shared interests**
4. Both users' profiles become partially public — you can now see each other's overlapping hobbies and interests (profiles are private by default, stored in the backend)
5. The chat has a **built-in conversation end point** — once reached, the app nudges both users toward meeting in person

**Why this works:**  
Shared context removes awkwardness. Instead of a cold "hey," the first message is already warm and relevant.

---

### Connection Method 2: HiFive (Proximity-Based)

When another HiFive user is within **10 meters** of you, you get the option to send them a HiFive — a lightweight, low-pressure signal of interest.

**How it works:**
1. Your phone detects a nearby HiFive user
2. You can optionally initiate a HiFive — a mutual ping
3. If both parties HiFive, a connection opens with shared interests revealed

**Key design principle:**  
> Follower counts and friend counts are **never shown.** HiFive is not a popularity contest.

---

## Core Design Principles

| Principle | What it means in practice |
|---|---|
| **Profiles are private by default** | Your interests and info are only revealed when a mutual connection is made |
| **No follower counts** | Social clout is invisible — connections are purely interest-based |
| **AI-assisted icebreaking** | The first question is generated based on what you actually have in common |
| **Built-in conversation endings** | Chats are designed to close, pushing users toward real-world meetups |
| **Proximity-first** | The HiFive feature only works when you're physically near someone |

---

## Tech Stack

- **Frontend:** HTML/JS (Vanilla) - designed for high-fidelity web experience.
- **Backend:** Node.js / Express
- **Database:** PostgreSQL (with `pg` pool)
- **Authentication:** Auth0 (JWT-based)
- **AI:** Gemini 1.5 Flash — generates personalized icebreaker questions.
- **Real-time:** Socket.IO for instant messaging and proximity alerts.

---

## Deployment Instructions (DigitalOcean)

### 1. Database Setup
1. Create a **Managed Database** for PostgreSQL on DigitalOcean.
2. In the "Connection Details", get the **Connection String** (DATABASE_URL).
3. Run the `backend/src/schema.sql` against your database to set up the tables.

### 2. App Platform / Droplet Setup
1. Upload this repository to **GitHub**.
### Option A: Docker (Recommended)
This is the most reliable method as it bypasses buildpack detection errors.
1. Push your repository to GitHub (ensure `Dockerfile` is in the root).
2. Create a new **App** on DigitalOcean.
3. DigitalOcean will detect the `Dockerfile` and use it to build your image.
4. Set your **Environment Variables** in the DO dashboard:
   - `DATABASE_URL`
   - `AUTH0_AUDIENCE`
   - `AUTH0_ISSUER`
   - `GEMINI_API_KEY`
5. The app will automatically run on port 3000.

### Option B: Buildpacks
If you prefer buildpacks, ensure `package.json` is in the root (which it is).
- Build Command: `npm install`
- Start Command: `npm start`

---

## Technical Details

- **Entry Point:** `backend/src/server.js`
- **Port:** Listens on `process.env.PORT || 3000`.
- **Static Assets:** Served directly from the project root.

---

### 3. Auth0 Configuration
1. Create an API in Auth0.
2. Set the `Identifier` to match your `AUTH0_AUDIENCE`.
3. In the "Permissions" tab, ensure no special scopes are required for basic access, or configure as needed.

---

## Status

✅ Backend framework migrated to PostgreSQL & Auth0  
✅ Gemini AI integration complete  
✅ Deployment-ready configuration  

---

*Built with the belief that the best connections happen face to face.*
