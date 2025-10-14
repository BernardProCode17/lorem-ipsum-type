/**
 * useAuth Hook
 * Custom React hook for authentication management
 * 
 * Features:
 * - Get current user
 * - Check if logged in
 * - Logout function
 * - Auto-refresh token
 */

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    if (token && username) {
      // Verify token is still valid
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        
        if (Date.now() < expirationTime) {
          setUser({ username });
          setIsAuthenticated(true);
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }

    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateScore = async (scoreData) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/scores/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scoreData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update score');
    }

    return data.data;
  };

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    updateScore,
    checkAuth
  };
}
