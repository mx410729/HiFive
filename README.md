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

## Tech Stack (Planned)

- **Frontend:** React Native (iOS + Android)
- **Backend:** Node.js / Firebase
- **AI:** Anthropic Claude API — generates personalized icebreaker questions from shared interest data
- **Location:** iOS/Android native location APIs, geofencing for 10m proximity detection
- **Auth:** OAuth / Apple Sign-In

---

## Why HiFive?

Most social apps make it easier to stay online. HiFive makes it easier to go offline — together. By removing follower counts, surfacing shared interests, and building in a natural conversation endpoint, HiFive lowers every decision barrier between meeting someone new and actually becoming friends.

---

## Status

🚧 Early concept / active development

---

*Built with the belief that the best connections happen face to face.*
