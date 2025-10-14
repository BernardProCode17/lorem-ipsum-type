/**
 * Application Configuration
 * Handles environment-specific settings for different deployment targets
 */

export const config = {
  // Deployment information
  deploymentType: import.meta.env.VITE_DEPLOYMENT_TYPE || 'standalone',
  appName: import.meta.env.VITE_APP_NAME || 'Lorem Ipsum Type',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Firebase configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  
  // Optional backend API
  apiUrl: import.meta.env.VITE_API_URL || '',
  
  // Feature flags based on deployment type
  features: {
    showFooter: import.meta.env.VITE_DEPLOYMENT_TYPE !== 'gaming-platform',
    enableAnalytics: import.meta.env.VITE_DEPLOYMENT_TYPE === 'standalone',
    showPortfolioLinks: import.meta.env.VITE_DEPLOYMENT_TYPE === 'standalone',
    compactUI: import.meta.env.VITE_DEPLOYMENT_TYPE === 'gaming-platform',
  },
  
  // Check if Firebase is configured
  isFirebaseConfigured() {
    return !!(this.firebase.apiKey && this.firebase.projectId)
  },
  
  // Get environment info
  isDevelopment() {
    return import.meta.env.DEV
  },
  
  isProduction() {
    return import.meta.env.PROD
  },
  
  isGamingPlatform() {
    return this.deploymentType === 'gaming-platform'
  },
  
  isStandalone() {
    return this.deploymentType === 'standalone'
  },
}

export default config
