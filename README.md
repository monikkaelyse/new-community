# CommunityE2E

A privacy-first community platform with end-to-end encryption. Messages and posts are encrypted client-side using TweetNaCl — the server never sees plaintext content.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express 5
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.io (WebSockets)
- **Encryption:** TweetNaCl.js (NaCl box for E2E, secretbox for key storage)
- **Auth:** JWT + Argon2 password hashing

## Prerequisites

- Node.js 22+ (use `nvm use 24` or similar)
- MongoDB running locally on port 27017

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd new-community

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and a strong JWT_SECRET
```

### 3. Start development servers

```bash
# Terminal 1 — Start the API server
cd server && npm run dev

# Terminal 2 — Start the React dev server
cd client && npm run dev
```

- Client runs at: http://localhost:5173
- API runs at: http://localhost:5000
- Vite proxies `/api/*` and `/socket.io` to the Express server automatically.

## Project Structure

```
new-community/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level pages
│       ├── services/        # API client, Socket.io, encryption
│       └── context/         # React context providers
├── server/                  # Express backend
│   └── src/
│       ├── models/          # Mongoose schemas
│       ├── routes/          # REST API endpoints
│       ├── middleware/       # Auth middleware
│       └── socket/          # Socket.io handlers
└── README.md
```

## Encryption Model

- Each user generates a **NaCl keypair** on registration
- **Public keys** are stored on the server (so others can encrypt to you)
- **Secret keys** are encrypted with a password-derived key before storage
- **Chat messages** use NaCl box (public-key authenticated encryption)
- **Board posts** use a shared community key distributed to members
- The server only sees **ciphertext** — it cannot read any user content
