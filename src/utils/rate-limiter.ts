// Simple client-side rate limiter to prevent API quota burn
// Tracks usage per user session

import React from 'react';

interface RateLimitState {
  requestsToday: number;
  lastResetDate: string;
  requestTimes: number[];
}

class RateLimiter {
  private static instance: RateLimiter;
  private state: RateLimitState;
  private readonly MAX_REQUESTS_PER_DAY = 5;
  private readonly COOLDOWN_MS = 10000; // 2 seconds between requests

  private constructor() {
    this.state = this.loadState();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private loadState(): RateLimitState {
    if (typeof window === 'undefined') {
      // Server-side - return default state
      return {
        requestsToday: 0,
        lastResetDate: new Date().toDateString(),
        requestTimes: []
      };
    }

    const stored = localStorage.getItem('gemini-rate-limit');
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = new Date().toDateString();
      
      // Reset if it's a new day
      if (parsed.lastResetDate !== today) {
        return {
          requestsToday: 0,
          lastResetDate: today,
          requestTimes: []
        };
      }
      
      return parsed;
    }

    return {
      requestsToday: 0,
      lastResetDate: new Date().toDateString(),
      requestTimes: []
    };
  }

  private saveState(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini-rate-limit', JSON.stringify(this.state));
    }
  }

  canMakeRequest(): { allowed: boolean; reason?: string; remainingRequests?: number } {
    const now = Date.now();
    
    // Check daily limit
    if (this.state.requestsToday >= this.MAX_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Daily limit reached (${this.MAX_REQUESTS_PER_DAY} requests/day). Please try again tomorrow.`,
        remainingRequests: 0
      };
    }

    // Check cooldown between requests
    const recentRequests = this.state.requestTimes.filter(
      time => now - time < this.COOLDOWN_MS
    );

    if (recentRequests.length > 0) {
      const timeUntilNext = this.COOLDOWN_MS - (now - recentRequests[0]);
      return {
        allowed: false,
        reason: `Please wait ${Math.ceil(timeUntilNext / 1000)} seconds before making another request.`,
        remainingRequests: this.MAX_REQUESTS_PER_DAY - this.state.requestsToday
      };
    }

    return {
      allowed: true,
      remainingRequests: this.MAX_REQUESTS_PER_DAY - this.state.requestsToday
    };
  }

  recordRequest(): void {
    const now = Date.now();
    
    // Clean old request times (older than cooldown period)
    this.state.requestTimes = this.state.requestTimes.filter(
      time => now - time < this.COOLDOWN_MS * 10 // Keep slightly longer for tracking
    );
    
    // Add current request time
    this.state.requestTimes.push(now);
    this.state.requestsToday++;
    
    this.saveState();
  }

  getStatus(): {
    requestsToday: number;
    maxRequests: number;
    remainingRequests: number;
    lastResetDate: string;
  } {
    return {
      requestsToday: this.state.requestsToday,
      maxRequests: this.MAX_REQUESTS_PER_DAY,
      remainingRequests: this.MAX_REQUESTS_PER_DAY - this.state.requestsToday,
      lastResetDate: this.state.lastResetDate
    };
  }

  reset(): void {
    this.state = {
      requestsToday: 0,
      lastResetDate: new Date().toDateString(),
      requestTimes: []
    };
    this.saveState();
  }
}

export const rateLimiter = RateLimiter.getInstance();

// React hook for rate limiting
export function useRateLimit() {
  const [status, setStatus] = React.useState(() => rateLimiter.getStatus());

  const updateStatus = React.useCallback(() => {
    setStatus(rateLimiter.getStatus());
  }, []);

  const canMakeRequest = React.useCallback(() => {
    return rateLimiter.canMakeRequest();
  }, []);

  const recordRequest = React.useCallback(() => {
    rateLimiter.recordRequest();
    updateStatus();
  }, [updateStatus]);

  const reset = React.useCallback(() => {
    rateLimiter.reset();
    updateStatus();
  }, [updateStatus]);

  return {
    status,
    canMakeRequest,
    recordRequest,
    reset,
    updateStatus
  };
}
