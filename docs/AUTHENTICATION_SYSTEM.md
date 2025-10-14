# Authentication System Documentation

## Overview
This document contains the complete authentication system design for the Lorem Type game. Users can create accounts without email requirements, update their scores securely, and optionally recover their accounts.

---

## System Design

### Core Components:
1. **Username** (unique, public, displayed on leaderboard)
2. **Abbreviation** (4-5 characters, alphanumeric, acts as identifier)
3. **PIN** (5-7 digits, acts as password)
4. **Recovery Code** (optional, 20-character backup for account recovery)
5. **Email** (optional, only used to send recovery code, NOT stored)

---

## Security Analysis

### Collision Probability

#### Abbreviation (5 characters, alphanumeric lowercase):
- Character set: 36 (a-z + 0-9)
- Combinations: 36^5 = **60,466,176** (~60 million)

#### PIN (6 digits):
- Combinations: 10^6 = **1,000,000**

#### Combined (Abbreviation + PIN):
- Total: 60,466,176 × 1,000,000 = **60.4 trillion combinations**

### Brute Force Attack Resistance (with Rate Limiting):
```
Attempts allowed: 3 per hour = 72 per day

Time to try all combinations:
60.4 trillion / 72 = 839 billion days = 2.3 billion years

✅ SECURE with rate limiting!
```

---

## Security Measures

### 1. Input Validation

#### Abbreviation Rules:
- ✅ Must be 4-5 characters
- ✅ Alphanumeric only (a-z, 0-9, case-insensitive)
- ❌ Cannot be similar to username (first 5 chars)
- ❌ Cannot be common patterns: `aaaaa`, `12345`, `abcde`
- ❌ Cannot be sequential: `abcde`, `12345`

**Examples:**
```
Username: "SpeedyTyper"
❌ "speed" → Too similar to username!
❌ "aaaaa" → Too predictable!
✅ "byn3i" → Good!
✅ "x7k2m" → Good!
```

#### PIN Rules:
- ✅ Must be 5-7 digits
- ❌ No sequential: `12345`, `23456`, `54321`, `56789`
- ❌ No repeated: `11111`, `12121`, `11223`
- ❌ No common PINs: `12345`, `00000`, `11111`, `12340`, `54321`

**Examples:**
```
❌ "12345" → Too common!
❌ "111111" → Too predictable!
❌ "123456" → Sequential!
✅ "582917" → Good!
✅ "749305" → Good!
```

### 2. Rate Limiting

#### Per Username:
- **3 attempts per hour**
- Lock account for **1 hour** after 3 failed attempts
- Reset counter on successful login

#### Per IP Address:
- **10 attempts per hour** across all usernames
- Prevents distributed attacks
- Temporary block for 1 hour

#### Progressive Delays:
```
1st failure: Instant retry allowed
2nd failure: 5 second wait + warning message
3rd failure: CAPTCHA required + 1 hour account lock
```

### 3. Password Hashing

**Use bcrypt with salt rounds = 12**

```javascript
// Example (bcrypt):
const hashedAbbreviation = await bcrypt.hash(abbreviation.toLowerCase(), 12);
const hashedPIN = await bcrypt.hash(pin, 12);
const hashedRecoveryCode = await bcrypt.hash(recoveryCode, 12);
```

**Why bcrypt?**
- Computationally expensive (slows down brute force)
- Built-in salting (prevents rainbow table attacks)
- Industry standard

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Public Info (visible on leaderboard)
  username VARCHAR(30) UNIQUE NOT NULL,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Private/Hashed Authentication
  abbreviation_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  pin_hash VARCHAR(255) NOT NULL,           -- bcrypt hash
  recovery_code_hash VARCHAR(255),          -- bcrypt hash (nullable)
  
  -- Security & Rate Limiting
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  last_ip VARCHAR(45),
  
  -- Indexes
  INDEX idx_username (username),
  INDEX idx_score (score DESC),
  INDEX idx_locked_until (locked_until)
);
```

### Rate Limiting Table (or use Redis)

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(100) NOT NULL,  -- username or IP
  identifier_type VARCHAR(20) NOT NULL,  -- 'username' or 'ip'
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_identifier (identifier, identifier_type),
  INDEX idx_window_start (window_start)
);
```

---

## User Flows

### 1. Registration Flow

```
Step 1: Enter Username
├─ Check if username is unique
├─ Must be 3-30 characters
└─ Alphanumeric + underscores only

Step 2: Create Abbreviation
├─ Enter 4-5 character code
├─ Validate: not similar to username
├─ Validate: not common pattern
├─ Show strength indicator
└─ Store bcrypt hash

Step 3: Create PIN
├─ Enter 5-7 digit code
├─ Validate: not sequential
├─ Validate: not common
├─ Show strength indicator
└─ Store bcrypt hash

Step 4: Recovery Options (Optional)
├─ Option A: Generate & Save Recovery Code
│   ├─ Generate 20-char code: "LOREM-7X9K-2M4P-8Q3R"
│   ├─ User downloads/copies it
│   └─ Store bcrypt hash in database
│
└─ Option B: Email Recovery Code
    ├─ User enters email (NOT stored)
    ├─ System sends recovery code to email
    ├─ User saves the code from email
    └─ Store bcrypt hash in database

Step 5: Confirmation
└─ Display success message with security reminders
```

### 2. Login Flow (Score Update)

```
Step 1: Enter Credentials
├─ Username
├─ Abbreviation
└─ PIN

Step 2: Rate Limit Check
├─ Check username attempts (max 3/hour)
├─ Check IP attempts (max 10/hour)
└─ If locked → Show error + time remaining

Step 3: Verify Credentials
├─ Fetch user by username
├─ Compare abbreviation_hash using bcrypt
├─ Compare pin_hash using bcrypt
└─ If match → Success!

Step 4: Handle Success/Failure
├─ Success:
│   ├─ Reset failed_attempts to 0
│   ├─ Update last_login timestamp
│   ├─ Return auth token (JWT)
│   └─ Allow score update
│
└─ Failure:
    ├─ Increment failed_attempts
    ├─ If attempts >= 3 → Lock account for 1 hour
    ├─ Show remaining attempts
    └─ Show progressive delay
```

### 3. Recovery Flow

```
Step 1: User Forgot Credentials
└─ Click "Forgot abbreviation/PIN?"

Step 2: Enter Username + Recovery Code
├─ Enter username
└─ Enter recovery code

Step 3: Verify Recovery Code
├─ Fetch user by username
├─ Compare recovery_code_hash using bcrypt
└─ If match → Allow reset

Step 4: Reset Credentials
├─ User creates new abbreviation
├─ User creates new PIN
├─ Generate NEW recovery code
└─ Update hashes in database

Step 5: Optional Email Recovery
├─ If user wants email recovery during reset
├─ Enter email (NOT stored)
├─ Send new recovery code to email
└─ User saves code for future
```

---

## API Endpoints

### 1. POST /api/auth/register
**Create new user account**

**Request:**
```json
{
  "username": "SpeedyTyper",
  "abbreviation": "byn3i",
  "pin": "582917",
  "generateRecoveryCode": true,
  "email": "optional@example.com"  // Only if user wants email delivery
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "data": {
    "username": "SpeedyTyper",
    "recoveryCode": "LOREM-7X9K-2M4P-8Q3R",  // Only returned once!
    "emailSent": true  // If email was provided
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Username already exists"
}
```

---

### 2. POST /api/auth/login
**Authenticate user and get token**

**Request:**
```json
{
  "username": "SpeedyTyper",
  "abbreviation": "byn3i",
  "pin": "582917"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "SpeedyTyper",
      "score": 1250,
      "rank": 5,
      "gamesPlayed": 42
    }
  }
}
```

**Response (Error - Locked):**
```json
{
  "success": false,
  "error": "Account locked due to too many failed attempts",
  "lockedUntil": "2025-10-14T16:30:00Z",
  "minutesRemaining": 45
}
```

**Response (Error - Invalid):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "attemptsRemaining": 2,
  "message": "You have 2 attempts remaining before account lock"
}
```

---

### 3. POST /api/scores/update
**Update user score (requires authentication)**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "score": 1500,
  "gameData": {
    "wpm": 75,
    "accuracy": 98.5,
    "time": 60
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Score updated successfully",
  "data": {
    "username": "SpeedyTyper",
    "newScore": 1500,
    "previousScore": 1250,
    "newRank": 3,
    "previousRank": 5
  }
}
```

---

### 4. POST /api/auth/recover
**Recover account with recovery code**

**Request:**
```json
{
  "username": "SpeedyTyper",
  "recoveryCode": "LOREM-7X9K-2M4P-8Q3R"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Recovery code verified",
  "data": {
    "resetToken": "temp_token_abc123"  // Valid for 15 minutes
  }
}
```

---

### 5. POST /api/auth/reset
**Reset credentials after recovery**

**Request:**
```json
{
  "resetToken": "temp_token_abc123",
  "newAbbreviation": "x7k2m",
  "newPin": "749305",
  "generateNewRecoveryCode": true,
  "email": "optional@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Credentials reset successfully",
  "data": {
    "username": "SpeedyTyper",
    "newRecoveryCode": "LOREM-2B5Y-9W3K-7M1X",
    "emailSent": true
  }
}
```

---

### 6. POST /api/auth/send-recovery-email
**Send recovery code to email (email NOT stored)**

**Request:**
```json
{
  "username": "SpeedyTyper",
  "recoveryCode": "LOREM-7X9K-2M4P-8Q3R",
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Recovery code sent to email",
  "note": "We do NOT store your email. This is a one-time delivery."
}
```

---

### 7. GET /api/leaderboard
**Get top scores (public endpoint)**

**Query Parameters:**
```
?limit=100&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "FastFingers",
        "score": 2500,
        "gamesPlayed": 150
      },
      {
        "rank": 2,
        "username": "TypeMaster",
        "score": 2350,
        "gamesPlayed": 120
      }
    ],
    "total": 1547
  }
}
```

---

## Security Best Practices

### 1. Never Store Plain Text
```javascript
❌ NEVER DO THIS:
database.save({ abbreviation: "byn3i", pin: "582917" })

✅ ALWAYS DO THIS:
const abbHash = await bcrypt.hash(abbreviation, 12);
const pinHash = await bcrypt.hash(pin, 12);
database.save({ abbreviation_hash: abbHash, pin_hash: pinHash });
```

### 2. Always Use HTTPS
- All API calls must use HTTPS in production
- Prevents man-in-the-middle attacks
- Protects credentials in transit

### 3. Rate Limiting
```javascript
// Check before authentication:
if (userAttempts >= 3) {
  return { error: "Too many attempts. Try again in 1 hour." };
}

if (ipAttempts >= 10) {
  return { error: "Too many requests from this IP." };
}
```

### 4. JWT Token Expiration
```javascript
// Generate short-lived tokens:
const token = jwt.sign(
  { username: user.username },
  SECRET_KEY,
  { expiresIn: '1h' }  // Token expires in 1 hour
);
```

### 5. Input Sanitization
```javascript
// Sanitize all inputs:
username = username.trim().toLowerCase();
abbreviation = abbreviation.trim().toLowerCase();
pin = pin.trim();

// Validate format:
if (!/^[a-z0-9_]{3,30}$/.test(username)) {
  throw new Error("Invalid username format");
}
```

---

## Common Attack Vectors & Mitigations

### Attack 1: Brute Force
**Threat:** Attacker tries many password combinations

**Mitigation:**
- ✅ Rate limiting (3 attempts/hour per username)
- ✅ Account lockout (1 hour after 3 failures)
- ✅ IP-based rate limiting (10 attempts/hour)
- ✅ CAPTCHA after 2nd failure

---

### Attack 2: Weak User Credentials
**Threat:** User chooses `"aaaaa"` and `"12345"`

**Mitigation:**
- ✅ Input validation (reject common patterns)
- ✅ Strength indicator during registration
- ✅ Educational warnings
- ✅ Blacklist common combinations

---

### Attack 3: Database Breach
**Threat:** Attacker gains access to database

**Mitigation:**
- ✅ All credentials are bcrypt hashed (irreversible)
- ✅ Salt is unique per user (built into bcrypt)
- ✅ Even with database, attacker can't login
- ✅ No recovery possible from hashes alone

---

### Attack 4: Timing Attacks
**Threat:** Attacker measures response time to determine if username exists

**Mitigation:**
- ✅ Always hash password even if username doesn't exist
- ✅ Use constant-time comparison (bcrypt does this)
- ✅ Same response format for all errors

```javascript
// Good practice:
async function login(username, abbreviation, pin) {
  const user = await findUser(username);
  
  // Always hash, even if user doesn't exist
  const abbHash = user?.abbreviation_hash || "$2b$12$dummy_hash";
  const pinHash = user?.pin_hash || "$2b$12$dummy_hash";
  
  // Constant-time comparison
  const abbMatch = await bcrypt.compare(abbreviation, abbHash);
  const pinMatch = await bcrypt.compare(pin, pinHash);
  
  if (!user || !abbMatch || !pinMatch) {
    return { error: "Invalid credentials" };  // Same error for all
  }
  
  return { success: true };
}
```

---

### Attack 5: Phishing
**Threat:** Fake website steals user credentials

**Mitigation:**
- ✅ Educate users (never ask for credentials via email)
- ✅ Use clear domain name
- ✅ Display security warnings in app
- ✅ HTTPS certificate with padlock icon

---

## Email System (No Storage)

### Privacy Promise:
> "We use your email ONLY to send you the recovery code. We do NOT store, track, or keep any record of your email address. Once sent, we immediately delete it from our system."

### Implementation:

```javascript
async function sendRecoveryEmail(email, recoveryCode, username) {
  // 1. Validate email format (basic check)
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
  
  // 2. Send email immediately
  await emailService.send({
    to: email,
    subject: "Your Lorem Type Recovery Code",
    html: `
      <h2>Account Recovery</h2>
      <p>Hi ${username},</p>
      <p>Your recovery code is:</p>
      <h3 style="background: #f0f0f0; padding: 15px; letter-spacing: 2px;">
        ${recoveryCode}
      </h3>
      <p><strong>Save this code in a safe place.</strong> You'll need it to recover your account if you forget your credentials.</p>
      <br>
      <p><strong>Privacy Notice:</strong> This email was sent at your request. We do NOT store your email address. This is a one-time delivery.</p>
      <hr>
      <small>If you didn't request this, someone may have entered your username by mistake. You can safely ignore this email.</small>
    `
  });
  
  // 3. DO NOT STORE EMAIL
  // No database insert, no logging, no tracking
  
  return { success: true };
}
```

### Email Provider Options:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Pay per use, very cheap)
- **Resend** (Modern, developer-friendly)

---

## Frontend User Experience

### Security Warnings to Display:

#### During Registration:
```
⚠️ Important Security Information

To protect your account:
✓ Choose a random abbreviation (not based on your username)
✓ Use a PIN that's not sequential (avoid 12345)
✓ Keep your credentials private

Recovery Options:
□ Generate a recovery code (recommended)
  Save it somewhere safe. We'll show it only once.
  
□ Send recovery code to email
  We won't store your email. This is just for delivery.
  
□ Skip recovery (you won't be able to recover your account)

[Continue]
```

#### During Login (After Failure):
```
❌ Invalid credentials

Attempts remaining: 2/3
After 3 failed attempts, your account will be locked for 1 hour.

Forgot your credentials? [Click here to recover]
```

#### Account Locked:
```
🔒 Account Temporarily Locked

Too many failed login attempts.
Your account will be unlocked in: 45 minutes

Why? This protects your account from unauthorized access attempts.

[Back to Home]
```

---

## Testing Checklist

### Registration:
- [ ] Username uniqueness enforced
- [ ] Abbreviation validation (no similar to username)
- [ ] Abbreviation validation (no common patterns)
- [ ] PIN validation (no sequential)
- [ ] PIN validation (no repeated digits)
- [ ] Recovery code generation works
- [ ] Email sending works (when provided)
- [ ] Email is NOT stored in database

### Login:
- [ ] Correct credentials work
- [ ] Wrong abbreviation fails
- [ ] Wrong PIN fails
- [ ] Rate limiting after 3 attempts
- [ ] Account locks for 1 hour
- [ ] Failed attempts reset on success
- [ ] IP-based rate limiting works

### Recovery:
- [ ] Valid recovery code works
- [ ] Invalid recovery code fails
- [ ] Can reset abbreviation
- [ ] Can reset PIN
- [ ] New recovery code generated
- [ ] Old recovery code invalidated

### Security:
- [ ] All passwords are hashed (never plain text)
- [ ] Bcrypt salt rounds = 12
- [ ] JWT tokens expire after 1 hour
- [ ] HTTPS enforced in production
- [ ] CORS configured properly
- [ ] SQL injection protected (use parameterized queries)
- [ ] XSS protected (sanitize inputs)

---

## Performance Considerations

### Database Indexes:
```sql
-- Speed up username lookups:
CREATE INDEX idx_username ON users(username);

-- Speed up leaderboard queries:
CREATE INDEX idx_score ON users(score DESC);

-- Speed up rate limit checks:
CREATE INDEX idx_locked_until ON users(locked_until);
```

### Caching:
```javascript
// Cache leaderboard for 5 minutes:
const leaderboard = await cache.get('leaderboard');
if (!leaderboard) {
  const data = await database.getTopScores(100);
  await cache.set('leaderboard', data, 300); // 5 minutes
  return data;
}
return leaderboard;
```

### Connection Pooling:
```javascript
// Use connection pooling for database:
const pool = new Pool({
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Compliance & Legal

### GDPR Compliance:
- ✅ No email storage (user privacy respected)
- ✅ User can delete account (right to be forgotten)
- ✅ Minimal data collection
- ✅ Clear privacy policy

### Privacy Policy (Suggested Text):
```
Lorem Type Privacy Policy

Data We Collect:
- Username (public, displayed on leaderboard)
- Game scores and statistics
- Hashed authentication credentials (cannot be reversed)

Data We DO NOT Collect:
- Email addresses (even if you provide one for recovery)
- Personal information
- Tracking cookies
- IP addresses (only for rate limiting, deleted after 1 hour)

Your Rights:
- Delete your account anytime
- Export your data
- No tracking, no ads, no selling of data

Questions? Contact: privacy@lorem-type.com
```

---

## Deployment Checklist

### Before Going Live:
- [ ] Change all SECRET_KEYS to production values
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS for your domain only
- [ ] Set up database backups
- [ ] Configure rate limiting (Redis or in-memory)
- [ ] Set up monitoring (error tracking)
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Load test with 1000+ concurrent users
- [ ] Security audit (OWASP top 10)
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Future Enhancements

### Possible Additions:
1. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app
   - Extra security for high scores

2. **Social Features**
   - Friend system (without exposing email)
   - Challenge friends to beat scores

3. **Account Verification Badge**
   - Verified accounts (optional email verification)
   - Displayed on leaderboard

4. **Security Audit Log**
   - Show user their login history
   - Alert on suspicious activity

5. **Multiple Recovery Methods**
   - Backup abbreviation/PIN
   - Security questions (optional)

---

## Support & Troubleshooting

### Common User Issues:

**"I forgot my abbreviation/PIN and don't have recovery code"**
- Response: "Unfortunately, we cannot recover your account without the recovery code. This is for your security. You'll need to create a new account."

**"Someone is trying to hack my account"**
- Response: "Your account is protected by rate limiting. After 3 failed attempts, it locks for 1 hour. Your credentials are safely hashed and cannot be reversed."

**"Why don't you just email me a reset link?"**
- Response: "We don't store email addresses for privacy reasons. You can optionally have us send you a recovery code during registration, but we delete your email immediately after sending."

**"Can I change my username?"**
- Response: "Usernames cannot be changed to prevent impersonation. If you want a different username, you'll need to create a new account."

---

## Summary

This authentication system provides:
- ✅ **Security**: 60 trillion possible combinations, rate limiting, bcrypt hashing
- ✅ **Privacy**: No email storage, minimal data collection
- ✅ **User-Friendly**: Easy to remember credentials (abbreviation + PIN)
- ✅ **Optional Recovery**: User chooses security vs. convenience
- ✅ **Scalable**: Designed for high-traffic game leaderboards
- ✅ **GDPR Compliant**: Respects user privacy

**Estimated Implementation Time:**
- Backend API: 6-8 hours
- Frontend Components: 4-6 hours
- Testing: 3-4 hours
- **Total: ~15-20 hours**

---

## Contact & Questions

For implementation questions or clarifications, refer to:
- `DATABASE_SCHEMA.sql` - Database structure
- `backend/` - API implementation
- `frontend/` - React components
- `utils/` - Helper functions
- `INTEGRATION_GUIDE.md` - Step-by-step setup

---

**Document Version:** 1.0  
**Last Updated:** October 14, 2025  
**Author:** GitHub Copilot  
**License:** MIT
