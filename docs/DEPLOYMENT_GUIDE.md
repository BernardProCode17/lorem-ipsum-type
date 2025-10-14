# 🚀 Deployment Guide

This guide covers deploying **Lorem Ipsum Type** to multiple platforms:
1. Gaming Platforms (Newgrounds, CrazyGames)
2. Your Portfolio Website
3. GitHub Pages (Free Hosting)
4. Vercel/Netlify (Professional Hosting)

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Node.js installed (v16+)
- ✅ Firebase project created (for database)
- ✅ Game tested locally
- ✅ All environment variables configured

---

## 🎮 1. Deploy to Gaming Platforms

### A. Build for Gaming Platforms

```bash
# Create optimized gaming platform build
npm run build:gaming
```

This creates a `dist-gaming` folder with:
- All assets using relative paths (`./`)
- Optimized for embedding in iframes
- Compact UI mode enabled

### B. Newgrounds Deployment

1. **Create Account**: [Sign up at Newgrounds](https://www.newgrounds.com/signup)

2. **Prepare Your Build**:
   - Navigate to `dist-gaming` folder
   - Zip all contents (NOT the folder itself)
   - File structure in zip:
     ```
     game.zip
     ├── index.html
     ├── assets/
     └── (all other files)
     ```

3. **Upload Game**:
   - Go to: https://www.newgrounds.com/projects/games/new
   - Upload your zip file
   - Set dimensions (recommended: 1280x720 or 1920x1080)
   - Add description, tags, thumbnail
   - Choose category: "Skill - Typing"

4. **Game Settings**:
   - Enable fullscreen support
   - Set age rating appropriately
   - Add screenshots/preview

### C. CrazyGames Deployment

1. **Apply as Developer**: [CrazyGames Developer Portal](https://developer.crazygames.com/)

2. **Quality Requirements**:
   - ⚠️ CrazyGames has strict quality standards
   - Must be polished and bug-free
   - Good graphics and gameplay
   - Mobile-friendly is a plus

3. **Upload Process**:
   - After approval, upload to their dashboard
   - They test your game before publishing
   - Integration with their SDK (optional)

4. **Build Preparation**:
   ```bash
   npm run build:gaming
   ```
   - Upload `dist-gaming` contents
   - Set to 1920x1080 resolution

### D. Other Gaming Platforms

**Itch.io** (Easiest):
```bash
npm run build:gaming
cd dist-gaming
zip -r ../lorem-type-game.zip .
```
- Upload to https://itch.io/game/new
- Set as HTML5 game
- Upload zip file
- Set viewport dimensions

**Kongregate**:
- Similar to Newgrounds
- Upload zip from `dist-gaming`
- Add API integration (optional)

**GameJolt**:
- Upload as HTML5 game
- Good for indie/retro games

---

## 🌐 2. Deploy to Your Portfolio Website

### A. Build for Portfolio

```bash
# Create production build
npm run build:portfolio
```

This creates a `dist` folder optimized for standalone hosting.

### B. Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure**:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Add Environment Variables**:
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Add your Firebase config

5. **Custom Domain** (Optional):
   - Add your domain in Vercel settings
   - Update DNS records

### C. Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

3. **Or Connect GitHub**:
   - Go to https://app.netlify.com
   - "New site from Git"
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### D. Option 3: GitHub Pages (Free)

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update vite.config.js base**:
   ```javascript
   base: '/lorem-ipsum-type/', // Your repo name
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Repository Settings → Pages
   - Source: `gh-pages` branch
   - Visit: https://yourusername.github.io/lorem-ipsum-type/

### E. Option 4: Your Own Server

1. **Build**:
   ```bash
   npm run build:portfolio
   ```

2. **Upload `dist` folder** to your server via FTP/SSH

3. **Configure Web Server**:
   
   **Apache (.htaccess)**:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
   
   **Nginx**:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

---

## 🔧 3. Environment Configuration

### Development (.env.development)
```env
VITE_DEPLOYMENT_TYPE=development
VITE_APP_NAME="Lorem Type [DEV]"
```

### Production (.env.production)
```env
VITE_DEPLOYMENT_TYPE=standalone
VITE_APP_NAME="Lorem Ipsum Type"
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
# ... other Firebase config
```

### Gaming Platform (.env.gaming)
```env
VITE_DEPLOYMENT_TYPE=gaming-platform
VITE_APP_NAME="Lorem Type"
VITE_FIREBASE_API_KEY=your_key
# ... same Firebase config
```

---

## 📱 4. Portfolio-Specific Features

When building for your portfolio, add these enhancements:

### A. Add Portfolio Links

Update your `Header.jsx` or `Footer.jsx`:

```jsx
import config from '../config'

export default function Header() {
  return (
    <header>
      {/* Your existing header */}
      
      {config.features.showPortfolioLinks && (
        <nav className="portfolio-links">
          <a href="https://yourportfolio.com" target="_blank">← Back to Portfolio</a>
          <a href="https://github.com/yourusername/lorem-ipsum-type" target="_blank">
            View Source
          </a>
        </nav>
      )}
    </header>
  )
}
```

### B. Add Analytics (Optional)

Install Google Analytics:
```bash
npm install react-ga4
```

In `main.jsx`:
```jsx
import ReactGA from 'react-ga4'
import config from './config'

if (config.features.enableAnalytics && config.analyticsId) {
  ReactGA.initialize(config.analyticsId)
}
```

### C. Add SEO Meta Tags

Update `index.html`:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO -->
  <title>Lorem Ipsum Type - Typing Speed Game</title>
  <meta name="description" content="Test your typing speed with Lorem Ipsum Type, a competitive typing game with real-time leaderboards.">
  <meta name="keywords" content="typing game, typing speed, lorem ipsum, competitive typing">
  <meta name="author" content="Your Name">
  
  <!-- Open Graph (Social Media) -->
  <meta property="og:title" content="Lorem Ipsum Type - Typing Game">
  <meta property="og:description" content="Test your typing speed and compete on the leaderboard!">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://yoursite.com/lorem-type">
  <meta property="og:image" content="/screenshot.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
```

---

## 🧪 5. Testing Builds

### Test Gaming Platform Build
```bash
npm run build:gaming
npm run preview:gaming
```
Open http://localhost:4173 and test in browser

### Test Portfolio Build
```bash
npm run build:portfolio
npm run preview
```

### Test in Different Browsers
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)
- Mobile browsers (Chrome, Safari iOS)

---

## ✅ 6. Pre-Deployment Checklist

Before deploying anywhere:

- [ ] All features working locally
- [ ] Firebase configured and connected
- [ ] Environment variables set correctly
- [ ] Game tested in different browsers
- [ ] No console errors
- [ ] Assets loading correctly
- [ ] Authentication works
- [ ] Leaderboard updates properly
- [ ] Responsive on mobile (if targeting that)
- [ ] Created screenshots/thumbnail
- [ ] Written game description
- [ ] Code committed to Git

---

## 🎯 7. Recommended Deployment Strategy

For maximum exposure:

1. **Week 1**: Deploy to your portfolio (Vercel/Netlify)
   - Test with real users
   - Fix any bugs
   - Gather feedback

2. **Week 2**: Deploy to Itch.io
   - Easiest gaming platform
   - Good for beta testing
   - Collect more feedback

3. **Week 3**: Deploy to Newgrounds
   - Larger gaming audience
   - Get ratings and reviews
   - Build community

4. **Week 4**: Apply to CrazyGames
   - Higher quality bar
   - Better monetization
   - Professional platform

---

## 🔥 8. Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev server

# Building
npm run build                  # Build for portfolio
npm run build:gaming          # Build for gaming platforms
npm run deploy:prepare        # Lint + build both versions

# Testing
npm run preview               # Preview portfolio build
npm run preview:gaming        # Preview gaming build

# Deployment
vercel                        # Deploy to Vercel
netlify deploy --prod         # Deploy to Netlify
npm run deploy                # Deploy to GitHub Pages (if configured)
```

---

## 🆘 Troubleshooting

### Assets Not Loading (Gaming Platforms)
- Ensure you built with `npm run build:gaming`
- Check that `base: './'` is set in vite.config.js for gaming mode

### Firebase Not Connecting
- Verify environment variables are set
- Check Firebase project settings
- Ensure Firestore database is created

### Routing Issues (404 on refresh)
- Configure server redirects (see section E above)
- For gaming platforms, use HashRouter instead of BrowserRouter

### Build Too Large
- Enable compression in hosting platform
- Optimize images before building
- Check bundle analyzer: `npm run build -- --mode analyze`

---

## 📚 Additional Resources

- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vercel Documentation](https://vercel.com/docs)
- [Newgrounds Developer Resources](https://www.newgrounds.com/wiki/creator-resources)
- [HTML5 Game Development](https://developer.mozilla.org/en-US/docs/Games)

---

**Need help?** Check the individual platform documentation or create an issue in your repository!
