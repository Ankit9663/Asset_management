'use client';

/**
 * UserContext — Simulated RBAC Session Provider
 * Manages active user selection across 11 demonstration accounts.
 * Persists selected user to localStorage and document.cookie.
 * Intercepts window.fetch to automatically append 'x-user-id' header.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SEEDED_USERS } from '@/lib/constants';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(SEEDED_USERS[0]); // Default: Vikram Trivedi (Admin)
  const [allUsers, setAllUsers] = useState(SEEDED_USERS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user from localStorage / cookies on client mount
  useEffect(() => {
    // 1. Fetch live users from API
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (data.users && data.users.length > 0) {
          setAllUsers(data.users);
        }
      })
      .catch(() => {});

    // 2. Read saved user ID from localStorage
    try {
      const savedId = localStorage.getItem('rb_user_id');
      if (savedId) {
        const found = SEEDED_USERS.find(u => u.id === savedId);
        if (found) {
          setCurrentUser(found);
          document.cookie = `user_id=${found.id}; path=/; max-age=864000; SameSite=Lax`;
        }
      } else {
        // Set default admin cookie
        document.cookie = `user_id=usr_admin; path=/; max-age=864000; SameSite=Lax`;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Intercept window.fetch to always include x-user-id header
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      config = config || {};
      const headers = new Headers(config.headers || {});

      // Add x-user-id if not already set
      if (currentUser?.id && !headers.has('x-user-id')) {
        headers.set('x-user-id', currentUser.id);
      }

      config.headers = headers;
      return originalFetch(resource, config);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [currentUser]);

  const login = useCallback((userOrId) => {
    let target = null;
    if (typeof userOrId === 'string') {
      target = allUsers.find(u => u.id === userOrId) || SEEDED_USERS.find(u => u.id === userOrId);
    } else {
      target = userOrId;
    }

    if (!target) return;

    setCurrentUser(target);
    try {
      localStorage.setItem('rb_user_id', target.id);
      document.cookie = `user_id=${target.id}; path=/; max-age=864000; SameSite=Lax`;
    } catch (e) {}
  }, [allUsers]);

  const logout = useCallback(() => {
    // Return to sign in page
    try {
      localStorage.removeItem('rb_user_id');
      document.cookie = `user_id=; path=/; max-age=0`;
    } catch (e) {}
    window.location.href = '/login';
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, allUsers, login, logout, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
