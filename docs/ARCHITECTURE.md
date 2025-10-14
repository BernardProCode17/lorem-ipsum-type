# System Architecture Diagram

## User Flow Diagrams

### 1. Registration Flow
```
┌─────────────┐
│   User      │
│  Opens App  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Clicks "Login"     │
│  Button in Header   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────┐
│  AuthModal Opens        │
│  (Default: Login Tab)   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  User Clicks            │
│  "Register" Tab         │
└──────┬──────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  User Fills Form:                  │
│  • Username                        │
│  • Abbreviation (4-5 chars)        │
│  • PIN (5-7 digits)                │
│  • [✓] Generate recovery code      │
│  • [✓] Send to email (optional)    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Frontend Validates Input          │
│  • Real-time validation            │
│  • Strength indicators shown       │
│  • Error messages if invalid       │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  POST /api/auth/register           │
│  {                                 │
│    username: "SpeedyTyper",        │
│    abbreviation: "k7m3x",          │
│    pin: "582917",                  │
│    generateRecoveryCode: true,     │
│    email: "user@example.com"       │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend Controller:               │
│  1. Validate inputs                │
│  2. Check username uniqueness      │
│  3. Hash abbreviation (bcrypt)     │
│  4. Hash PIN (bcrypt)              │
│  5. Generate recovery code         │
│  6. Hash recovery code (bcrypt)    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Insert into Database:             │
│  INSERT INTO users (               │
│    username,                       │
│    abbreviation_hash,              │
│    pin_hash,                       │
│    recovery_code_hash              │
│  ) VALUES (...)                    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Send Email (if provided):         │
│  • Email used ONLY for delivery    │
│  • Email NOT stored in database    │
│  • Recovery code sent to email     │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Return Response:                  │
│  {                                 │
│    success: true,                  │
│    data: {                         │
│      username: "SpeedyTyper",      │
│      recoveryCode: "LOREM-7X9K..." │
│    }                               │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Frontend Shows Recovery Code:     │
│  • Large, copyable text            │
│  • [Copy] button                   │
│  • [Download] button               │
│  • Warning: "Shown only once!"     │
│  • [I've Saved It] button          │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  User Acknowledges                 │
│  → Modal Closes                    │
│  → Account Created ✓               │
└────────────────────────────────────┘
```

---

### 2. Login Flow
```
┌─────────────┐
│   User      │
│  Opens App  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  AuthModal Opens    │
│  (Login Tab)        │
└──────┬──────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  User Enters Credentials:          │
│  • Username: "SpeedyTyper"         │
│  • Abbreviation: "k7m3x"           │
│  • PIN: "582917"                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  POST /api/auth/login              │
│  {                                 │
│    username: "SpeedyTyper",        │
│    abbreviation: "k7m3x",          │
│    pin: "582917"                   │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Check Rate Limit         │
│  • Username: 2/3 attempts used     │
│  • IP: 5/10 attempts used          │
│  • If exceeded → Block request     │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Check Account Lock       │
│  • locked_until: NULL (not locked) │
│  • Continue to verification        │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Verify Credentials       │
│  1. Fetch user by username         │
│  2. Compare abbreviation:          │
│     bcrypt.compare(input, hash)    │
│  3. Compare PIN:                   │
│     bcrypt.compare(input, hash)    │
└──────┬─────────────────────────────┘
       │
    ┌──┴──┐
    │Match│
    └──┬──┘
       │
   ┌───┴────┐
   │        │
  YES      NO
   │        │
   │        ▼
   │   ┌────────────────────────────┐
   │   │  Increment failed_attempts │
   │   │  If >= 3: Lock 1 hour      │
   │   │  Return error message      │
   │   └────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│  Success:                          │
│  1. Reset failed_attempts = 0      │
│  2. Update last_login              │
│  3. Generate JWT token             │
│     jwt.sign({userId, username})   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Return Response:                  │
│  {                                 │
│    success: true,                  │
│    data: {                         │
│      token: "eyJhbGc...",          │
│      user: {                       │
│        username: "SpeedyTyper",    │
│        score: 1250,                │
│        rank: 5                     │
│      }                             │
│    }                               │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Frontend:                         │
│  1. Save token to localStorage     │
│  2. Save username to localStorage  │
│  3. Close modal                    │
│  4. Update UI (show username)      │
└────────────────────────────────────┘
```

---

### 3. Score Update Flow
```
┌─────────────┐
│   User      │
│  Plays Game │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────┐
│  Game Ends:                        │
│  • Final Score: 1500               │
│  • WPM: 75                         │
│  • Accuracy: 98.5%                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Check if User Logged In           │
│  isAuthenticated = true            │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  POST /api/scores/update           │
│  Headers:                          │
│    Authorization: Bearer <token>   │
│  Body:                             │
│  {                                 │
│    score: 1500,                    │
│    gameData: {                     │
│      wpm: 75,                      │
│      accuracy: 98.5,               │
│      time: 60,                     │
│      gameMode: "normal"            │
│    }                               │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Verify JWT Token         │
│  jwt.verify(token, secret)         │
│  Extract: userId, username         │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Fetch Current User       │
│  SELECT * FROM users               │
│  WHERE id = userId                 │
│  Current score: 1250               │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Update Score             │
│  • New score = MAX(1500, 1250)     │
│  • New score = 1500 (higher!)      │
│  • Increment games_played          │
│  • Update best_wpm if higher       │
│  • Update best_accuracy if higher  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Save Game History        │
│  INSERT INTO game_history (        │
│    user_id, score, wpm,            │
│    accuracy, game_mode             │
│  ) VALUES (...)                    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Backend: Recalculate Ranks        │
│  SELECT update_user_ranks()        │
│  • Rank all users by score DESC    │
│  • New rank: 3 (was 5)             │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Return Response:                  │
│  {                                 │
│    success: true,                  │
│    data: {                         │
│      newScore: 1500,               │
│      previousScore: 1250,          │
│      newRank: 3,                   │
│      previousRank: 5,              │
│      scoreImproved: true,          │
│      rankImproved: true            │
│    }                               │
│  }                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  Frontend: Show Success Message    │
│  "Score updated! New rank: #3"     │
│  🎉 Rank improved from #5 to #3!   │
└────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       FRONTEND                          │
│                    (React + Vite)                       │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐      │
│  │  Header   │  │   Home    │  │    Rank      │      │
│  │ Component │  │   Page    │  │    Page      │      │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘      │
│        │              │                │               │
│        ▼              ▼                ▼               │
│  ┌──────────────────────────────────────────┐         │
│  │         AuthModal Component              │         │
│  │  (Registration, Login, Recovery)         │         │
│  └──────────────────┬───────────────────────┘         │
│                     │                                  │
│                     ▼                                  │
│  ┌──────────────────────────────────────────┐         │
│  │           useAuth Hook                   │         │
│  │  (Authentication State Management)       │         │
│  └──────────────────┬───────────────────────┘         │
│                     │                                  │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ HTTP/HTTPS Requests
                      │ (JSON)
                      │
┌─────────────────────┼──────────────────────────────────┐
│                     ▼                                  │
│                 API Layer                              │
│          (Express.js Routes)                           │
│                                                         │
│  /api/auth/*        /api/scores/*      /api/*         │
│  ┌────────────┐    ┌─────────────┐    ┌─────────┐    │
│  │ Registration│    │   Update    │    │Leaderboard│   │
│  │   Login    │    │   Score     │    │  User     │   │
│  │  Recovery  │    │             │    │  Profile  │   │
│  └─────┬──────┘    └──────┬──────┘    └────┬────┘    │
│        │                  │                  │         │
│        ▼                  ▼                  ▼         │
│  ┌──────────────────────────────────────────────┐    │
│  │           CONTROLLERS                         │    │
│  ├──────────────────────────────────────────────┤    │
│  │  auth.controller.js  │  score.controller.js  │    │
│  └───────┬──────────────┴────────┬──────────────┘    │
│          │                       │                    │
│          ▼                       ▼                    │
│  ┌──────────────────────────────────────────────┐    │
│  │              UTILITIES                        │    │
│  ├──────────────────────────────────────────────┤    │
│  │ validation.js │ rateLimit.js │  email.js     │    │
│  │                                               │    │
│  │ • Input validation                            │    │
│  │ • Strength calculation                        │    │
│  │ • Rate limiting logic                         │    │
│  │ • Recovery code generation                    │    │
│  │ • Email sending (no storage)                  │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                     │
└─────────────────┼─────────────────────────────────────┘
                  │
                  │ Database Queries
                  │ (SQL)
                  │
┌─────────────────┼─────────────────────────────────────┐
│                 ▼                                      │
│           DATABASE LAYER                               │
│      (PostgreSQL or MySQL)                             │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   users     │  │ rate_limits  │  │game_history  │ │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ id          │  │ identifier   │  │ user_id      │ │
│  │ username    │  │ type         │  │ score        │ │
│  │ abbr_hash   │  │ attempts     │  │ wpm          │ │
│  │ pin_hash    │  │ window_start │  │ accuracy     │ │
│  │ recovery_hash│  └──────────────┘  │ played_at    │ │
│  │ score       │                     └──────────────┘ │
│  │ rank        │                                       │
│  │ games_played│                                       │
│  └─────────────┘                                       │
│                                                         │
│  Indexes: username, score DESC, rank                   │
└─────────────────────────────────────────────────────────┘

                         │
                         ▼
            ┌─────────────────────────┐
            │   EXTERNAL SERVICES     │
            ├─────────────────────────┤
            │ • Email Service (SMTP)  │
            │ • Redis (Optional)      │
            └─────────────────────────┘
```

---

## Data Flow: Registration

```
User Input          Validation          Hashing           Database
──────────          ──────────          ───────           ────────

Username:           ✓ 3-30 chars        (Not hashed)      username
"SpeedyTyper"       ✓ Alphanumeric      Stored as-is      └─► "speedytyper"
                    ✓ Unique check                        (lowercase)

Abbreviation:       ✓ 4-5 chars         bcrypt(k7m3x)     abbreviation_hash
"k7m3x"             ✓ Not similar       Salt rounds: 12   └─► "$2b$12$..."
                    ✓ Not common        
                    ✓ Not sequential    

PIN:                ✓ 5-7 digits        bcrypt(582917)    pin_hash
"582917"            ✓ Not common        Salt rounds: 12   └─► "$2b$12$..."
                    ✓ Not sequential    

Recovery Code:      Generated           bcrypt(LOREM...)  recovery_code_hash
(Generated)         "LOREM-7X9K-2M4P"   Salt rounds: 12   └─► "$2b$12$..."
└─► Shown once!     └─► Random 16 chars

Email:              Validate format     NOT STORED!       (Not saved)
"user@example.com"  Send recovery code  Only for delivery
(Optional)          Delete immediately  ❌ No database
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────┐
│                  Layer 7: User Actions                   │
│  User must know: Username + Abbreviation + PIN           │
│  Combinations: 60 trillion (60,466,176,000,000)          │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│              Layer 6: Rate Limiting                       │
│  • 3 attempts per username per hour                       │
│  • 10 attempts per IP per hour                            │
│  • Attack time: 2.3 billion years                         │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Layer 5: Account Lockout                       │
│  • Lock after 3 failed attempts                           │
│  • Locked for 1 hour                                      │
│  • Prevents rapid brute force                             │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Layer 4: Input Validation                      │
│  • Rejects weak patterns (12345, aaaaa)                  │
│  • Prevents similar abbreviation to username             │
│  • Forces strong credentials                              │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Layer 3: bcrypt Hashing                        │
│  • Salt rounds = 12 (very slow)                          │
│  • Cannot be reversed                                     │
│  • Rainbow tables useless                                 │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Layer 2: JWT Tokens                            │
│  • Short-lived (1 hour expiration)                       │
│  • Signed with secret key                                 │
│  • Stateless authentication                               │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Layer 1: HTTPS Encryption                      │
│  • All traffic encrypted                                  │
│  • Prevents eavesdropping                                 │
│  • SSL/TLS certificates                                   │
└──────────────────────────────────────────────────────────┘
```

---

## File Organization

```
lorem-type/
│
├── docs/ (📚 All documentation - current folder)
│   ├── README.md                    ← START HERE
│   ├── AUTHENTICATION_SYSTEM.md     ← Complete details
│   ├── INTEGRATION_GUIDE.md         ← Setup instructions
│   ├── ARCHITECTURE.md              ← This file
│   ├── DATABASE_SCHEMA.sql          ← Database structure
│   │
│   ├── backend/
│   │   ├── auth.controller.js       ← Registration/Login
│   │   ├── score.controller.js      ← Score updates
│   │   ├── routes.js                ← API routes
│   │   └── package.json             ← Dependencies
│   │
│   ├── utils/
│   │   ├── validation.js            ← Input validation
│   │   ├── rateLimit.js             ← Rate limiting
│   │   └── email.js                 ← Email sending
│   │
│   └── frontend/
│       ├── AuthModal.jsx            ← Login/Register modal
│       ├── AuthModal.css            ← Modal styles
│       └── useAuth.js               ← Auth hook
│
├── backend/ (⚙️ Copy files here when ready)
│   ├── server.js                    ← Create this
│   ├── database.js                  ← Create this
│   ├── .env                         ← Create this
│   ├── controllers/ ←────────────── Copy from docs/backend/
│   └── utils/ ←──────────────────── Copy from docs/utils/
│
└── src/ (⚛️ Your React frontend)
    ├── components/
    │   ├── Header.jsx               ← Update with auth
    │   ├── GameDisplay.jsx          ← Update with score submit
    │   └── AuthModal.jsx ←────────── Copy from docs/frontend/
    │
    └── hooks/
        └── useAuth.js ←─────────────── Copy from docs/frontend/
```

---

## Technology Stack

```
┌───────────────────────────────────────────────────┐
│                   FRONTEND                        │
├───────────────────────────────────────────────────┤
│ • React 19.1.1                                    │
│ • React Router 7.9.4                              │
│ • Vite 7.1.7 (Build tool)                         │
│ • CSS3 (Responsive + Dark mode)                   │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│                   BACKEND                         │
├───────────────────────────────────────────────────┤
│ • Node.js (v16+)                                  │
│ • Express.js 4.18.2                               │
│ • bcrypt 5.1.1 (Password hashing)                 │
│ • jsonwebtoken 9.0.2 (JWT tokens)                 │
│ • nodemailer 6.9.7 (Email sending)                │
│ • cors 2.8.5 (CORS handling)                      │
│ • dotenv 16.3.1 (Environment variables)           │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│                   DATABASE                        │
├───────────────────────────────────────────────────┤
│ PostgreSQL 12+ (Recommended)                      │
│ OR                                                │
│ MySQL 8+ (Alternative)                            │
│                                                   │
│ • pg 8.11.3 (PostgreSQL driver)                   │
│ • mysql2 (MySQL driver)                           │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│               OPTIONAL SERVICES                   │
├───────────────────────────────────────────────────┤
│ • Redis (Production rate limiting)                │
│ • SendGrid/Mailgun (Email delivery)               │
│ • PM2 (Process management)                        │
│ • Winston (Logging)                               │
└───────────────────────────────────────────────────┘
```

---

**This architecture provides a complete, secure, scalable authentication system for your typing game!**
