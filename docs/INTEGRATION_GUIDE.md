# Integration Guide
## Step-by-Step Setup for Lorem Type Authentication System

This guide will help you integrate the authentication system when you're ready to work on it.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Database Setup](#database-setup)
4. [Frontend Integration](#frontend-integration)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Prerequisites

### Required Software:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher) or **MySQL** (v8 or higher)
- **npm** or **yarn** package manager

### Required npm packages:

**Backend:**
```bash
npm install express bcrypt jsonwebtoken cors dotenv
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL

# Optional (for email):
npm install nodemailer

# Optional (for production rate limiting):
npm install redis
```

**Frontend:**
Already have React installed ✅

---

## Backend Setup

### Step 1: Create Backend Directory Structure

```
lorem-type/
├── docs/  (you have this already with the files)
├── backend/  (create this)
│   ├── server.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── score.controller.js
│   ├── utils/
│   │   ├── validation.js
│   │   ├── rateLimit.js
│   │   └── email.js
│   ├── routes.js
│   └── database.js
├── src/  (your React frontend)
└── package.json
```

### Step 2: Copy Files from docs/ to backend/

**PowerShell commands:**
```powershell
# Create backend directories
New-Item -Path "backend/controllers" -ItemType Directory -Force
New-Item -Path "backend/utils" -ItemType Directory -Force

# Copy controller files
Copy-Item "docs/backend/auth.controller.js" -Destination "backend/controllers/"
Copy-Item "docs/backend/score.controller.js" -Destination "backend/controllers/"
Copy-Item "docs/backend/routes.js" -Destination "backend/"

# Copy utility files
Copy-Item "docs/utils/validation.js" -Destination "backend/utils/"
Copy-Item "docs/utils/rateLimit.js" -Destination "backend/utils/"
Copy-Item "docs/utils/email.js" -Destination "backend/utils/"
```

### Step 3: Create server.js

Create `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Create database.js

Create `backend/database.js`:

**For PostgreSQL:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lorem_type',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export query function
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool
};
```

**For MySQL:**
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'lorem_type',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

// Export query function (compatible with PostgreSQL syntax)
const query = async (text, params) => {
  // Convert PostgreSQL $1, $2 syntax to MySQL ? syntax
  let mysqlQuery = text;
  if (params) {
    params.forEach((param, index) => {
      mysqlQuery = mysqlQuery.replace(`$${index + 1}`, '?');
    });
  }
  
  const [rows] = await pool.execute(mysqlQuery, params);
  return { rows };
};

module.exports = {
  query,
  pool
};
```

### Step 5: Update Controllers to Use Database

In `backend/controllers/auth.controller.js` and `backend/controllers/score.controller.js`, add this line at the top:

```javascript
const db = require('../database');
```

Then replace all `db.query()` calls (they're already in the code as placeholders with TODO comments).

---

## Database Setup

### Step 1: Create Database

**PostgreSQL:**
```sql
CREATE DATABASE lorem_type;
```

**MySQL:**
```sql
CREATE DATABASE lorem_type CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lorem_type;
```

### Step 2: Run Schema

Execute the SQL from `docs/DATABASE_SCHEMA.sql`:

**PowerShell (PostgreSQL):**
```powershell
psql -U postgres -d lorem_type -f docs/DATABASE_SCHEMA.sql
```

**PowerShell (MySQL):**
```powershell
mysql -u root -p lorem_type < docs/DATABASE_SCHEMA.sql
```

### Step 3: Verify Tables

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'  -- PostgreSQL
-- OR
WHERE table_schema = 'lorem_type'  -- MySQL

-- Should show: users, rate_limits, game_history
```

---

## Frontend Integration

### Step 1: Copy Frontend Components

```powershell
# Copy to your components directory
Copy-Item "docs/frontend/AuthModal.jsx" -Destination "src/components/"
Copy-Item "docs/frontend/AuthModal.css" -Destination "src/components/"
Copy-Item "docs/frontend/useAuth.js" -Destination "src/hooks/"
```

(Create `src/hooks/` directory if it doesn't exist)

### Step 2: Update Your App.jsx

Add authentication state management:

```jsx
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Rank from './pages/Rank';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import './styles/App.css';

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleAuthSuccess = (userData) => {
    console.log('User authenticated:', userData);
    // Optionally refresh leaderboard or update UI
  };

  return (
    <>
      <Header 
        user={user}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={logout}
      />
      
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/rank" element={<Rank />} />
      </Routes>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        mode="login"
      />
    </>
  );
}
```

### Step 3: Update Header.jsx

Add login/logout buttons:

```jsx
import { Link } from 'react-router-dom';

export default function Header({ user, isAuthenticated, onLoginClick, onLogout }) {
  return (
    <header>
      <div>
        <h1>Lorem Ipsum Type</h1>
      </div>

      <div>
        <nav>
          <ul>
            <li><Link to="/">Game</Link></li>
            <li><Link to="/rank">Rank</Link></li>
            {isAuthenticated ? (
              <>
                <li>Welcome, {user.username}!</li>
                <li><button onClick={onLogout}>Logout</button></li>
              </>
            ) : (
              <li><button onClick={onLoginClick}>Login</button></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

### Step 4: Update GameDisplay.jsx

Add score submission after game ends:

```jsx
import { useAuth } from '../hooks/useAuth';

export default function GameDisplay() {
  const { isAuthenticated, updateScore } = useAuth();
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleGameEnd = async (score, gameData) => {
    setFinalScore(score);
    setGameEnded(true);

    if (isAuthenticated) {
      try {
        const result = await updateScore({
          score: score,
          gameData: {
            wpm: gameData.wpm,
            accuracy: gameData.accuracy,
            time: gameData.time,
            gameMode: gameData.mode,
            wordType: gameData.wordType
          }
        });

        console.log('Score updated:', result);
        alert(`Score updated! Your new rank: ${result.newRank}`);
      } catch (error) {
        console.error('Failed to update score:', error);
        alert('Failed to save score. Please try logging in again.');
      }
    } else {
      alert('Login to save your score!');
    }
  };

  // ... rest of your game logic
}
```

---

## Environment Variables

### Step 1: Create .env File

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lorem_type
DB_USER=postgres
DB_PASSWORD=your_password_here

# OR Database Configuration (MySQL)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=lorem_type
# DB_USER=root
# DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=1h

# Email Configuration (Optional)
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@lorem-type.com
EMAIL_FROM_NAME=Lorem Type

# SMTP Configuration (if using email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SendGrid (alternative)
# SENDGRID_API_KEY=your-sendgrid-api-key

# Redis Configuration (Optional, for production)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

**Important:** Add `.env` to `.gitignore`!

```
# Add to .gitignore
backend/.env
.env
```

### Step 2: Create .env.example

Create `backend/.env.example` (safe to commit):

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=lorem_type
DB_USER=postgres
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRATION=1h

EMAIL_SERVICE=smtp
EMAIL_FROM=
EMAIL_FROM_NAME=Lorem Type

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

---

## Testing

### Step 1: Start Backend Server

```powershell
cd backend
node server.js
```

Should see: `Server running on port 3001`

### Step 2: Test API Endpoints

**Health Check:**
```powershell
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Lorem Type API is running",
  "timestamp": "2025-10-14T..."
}
```

**Test Registration:**
```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"testuser\",\"abbreviation\":\"abc12\",\"pin\":\"582917\",\"generateRecoveryCode\":true}'
```

Should return user data with recovery code.

**Test Login:**
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"testuser\",\"abbreviation\":\"abc12\",\"pin\":\"582917\"}'
```

Should return JWT token.

### Step 3: Start Frontend

```powershell
cd ..  # Back to root
npm run dev
```

Visit `http://localhost:5173` (or your Vite port)

### Step 4: Test Full Flow

1. Click "Login" button
2. Switch to "Register" tab
3. Create an account
4. Save recovery code
5. Play a game
6. Submit score
7. Check leaderboard

---

## Proxy Configuration (Development)

To avoid CORS issues during development, configure Vite proxy:

Update `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
```

Now your frontend can call `/api/...` directly!

---

## Deployment

### Production Checklist:

#### Backend:
- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong `JWT_SECRET` (random 64+ character string)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up Redis for rate limiting (recommended)
- [ ] Configure production database (not localhost)
- [ ] Set up automatic backups
- [ ] Enable database connection pooling
- [ ] Add monitoring (e.g., PM2, New Relic)
- [ ] Set up logging (e.g., Winston)

#### Frontend:
- [ ] Build production bundle: `npm run build`
- [ ] Set correct API URL in production
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain only

#### Database:
- [ ] Run schema on production database
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Use SSL connection
- [ ] Set up monitoring

### Deployment Options:

**Backend:**
- **Heroku** (easy, free tier)
- **Railway** (modern, free tier)
- **AWS EC2** (more control)
- **DigitalOcean** (simple VPS)
- **Vercel/Netlify** (serverless functions)

**Database:**
- **Supabase** (PostgreSQL, free tier, easy)
- **PlanetScale** (MySQL, free tier)
- **AWS RDS** (managed database)
- **DigitalOcean Managed Database**

**Frontend:**
- **Vercel** (recommended for Vite/React)
- **Netlify**
- **GitHub Pages** (static only)
- **Cloudflare Pages**

---

## Quick Start Commands

### Development:

```powershell
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

### Production Build:

```powershell
# Build frontend
npm run build

# Start backend (with PM2)
pm2 start backend/server.js --name lorem-type-api

# Or with node
cd backend
NODE_ENV=production node server.js
```

---

## Troubleshooting

### Backend won't start:
- Check database is running
- Verify `.env` file exists and has correct values
- Check port 3001 is not in use
- Run `npm install` in backend directory

### Frontend can't connect to API:
- Verify backend is running on port 3001
- Check vite.config.js proxy configuration
- Look for CORS errors in browser console
- Verify API URL is correct

### Database connection errors:
- Check database is running
- Verify credentials in `.env`
- Test connection: `psql -U postgres` or `mysql -u root -p`
- Check firewall/network settings

### Login/Registration fails:
- Check browser console for errors
- Verify API endpoints return correct data
- Check database has correct schema
- Look at backend server logs

---

## Next Steps

1. **Test thoroughly** - Try all user flows
2. **Add error handling** - Handle edge cases
3. **Implement rate limiting** - Use Redis in production
4. **Set up email service** - Configure SendGrid/Mailgun
5. **Add analytics** - Track user behavior
6. **Implement caching** - Cache leaderboard data
7. **Add tests** - Write unit and integration tests
8. **Security audit** - Review code for vulnerabilities
9. **Performance optimization** - Optimize queries and caching
10. **Deploy to production** - Go live!

---

## Support

For questions or issues with this implementation:
1. Review `docs/AUTHENTICATION_SYSTEM.md` for detailed documentation
2. Check `docs/DATABASE_SCHEMA.sql` for database structure
3. Inspect backend controllers for API logic
4. Review frontend components for UI implementation

---

## Additional Resources

- [bcrypt documentation](https://www.npmjs.com/package/bcrypt)
- [JWT introduction](https://jwt.io/introduction)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Express.js guide](https://expressjs.com/en/guide/routing.html)
- [React hooks](https://react.dev/reference/react)

---

**Good luck with your implementation! 🚀**

If you encounter any issues during integration, refer to the comprehensive documentation in `docs/AUTHENTICATION_SYSTEM.md`.
