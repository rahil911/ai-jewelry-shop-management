import { useEffect, useRef, useCallback } from 'react';
import { tokenManager, type TokenPayload } from '@/lib/auth/tokenManager';
import { useAuthStore } from './useAuth';

interface UseTokenRefreshOptions {
  enabled?: boolean;
  onTokenRefreshed?: (newToken: string) => void;
  onRefreshError?: (error: Error) => void;
  refreshInterval?: number; // in milliseconds
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    enabled = true,
    onTokenRefreshed,
    onRefreshError,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token: currentToken, checkAuth } = useAuthStore();

  const refreshToken = useCallback(async () => {
    try {
      console.log('🔄 Checking token status...');
      
      const storedToken = tokenManager.getValidToken();
      const payload = tokenManager.getTokenPayload(storedToken);
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Check if token needs refresh
      if (tokenManager.needsRefresh(storedToken)) {
        console.log('🔄 Token needs refresh, generating new token...');
        const newToken = tokenManager.forceRefresh();
        
        // Update auth store
        checkAuth();
        
        console.log('✅ Token refreshed successfully');
        onTokenRefreshed?.(newToken);
        
        return newToken;
      } else {
        console.log('✅ Token is still valid');
        return storedToken;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      onRefreshError?.(error as Error);
      
      // Generate fresh token as fallback
      try {
        const fallbackToken = tokenManager.forceRefresh();
        checkAuth();
        return fallbackToken;
      } catch (fallbackError) {
        console.error('❌ Fallback token generation failed:', fallbackError);
        throw fallbackError;
      }
    }
  }, [onTokenRefreshed, onRefreshError, checkAuth]);

  const startTokenRefreshTimer = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clear existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial token check
    refreshToken();

    // Setup periodic refresh
    intervalRef.current = setInterval(() => {
      refreshToken();
    }, refreshInterval);

    console.log(`⏰ Token refresh timer started (interval: ${refreshInterval / 1000}s)`);
  }, [enabled, refreshInterval, refreshToken]);

  const stopTokenRefreshTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏸️ Token refresh timer stopped');
    }
  }, []);

  // Setup auto-refresh on mount
  useEffect(() => {
    if (enabled) {
      startTokenRefreshTimer();
      
      // Setup automatic refresh before expiry
      tokenManager.setupAutoRefresh((newToken) => {
        console.log('🔄 Auto-refresh completed');
        checkAuth();
        onTokenRefreshed?.(newToken);
      });
    }

    return () => {
      stopTokenRefreshTimer();
      tokenManager.clearAutoRefresh();
    };
  }, [enabled, startTokenRefreshTimer, stopTokenRefreshTimer, checkAuth, onTokenRefreshed]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    try {
      const newToken = await refreshToken();
      return { success: true, token: newToken };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }, [refreshToken]);

  // Get current token status
  const getTokenStatus = useCallback(() => {
    const token = tokenManager.getValidToken();
    const payload = tokenManager.getTokenPayload(token);
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry(token);
    const needsRefresh = tokenManager.needsRefresh(token);

    return {
      token,
      payload,
      timeUntilExpiry,
      needsRefresh,
      expiryDate: payload?.exp ? new Date(payload.exp * 1000) : null,
      isValid: !needsRefresh
    };
  }, []);

  return {
    refreshToken: manualRefresh,
    getTokenStatus,
    startTimer: startTokenRefreshTimer,
    stopTimer: stopTokenRefreshTimer,
    isEnabled: enabled
  };
}

// Hook for getting current token status
export function useTokenStatus() {
  const getStatus = useCallback(() => {
    const token = tokenManager.getValidToken();
    const payload = tokenManager.getTokenPayload(token);
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry(token);
    const needsRefresh = tokenManager.needsRefresh(token);

    return {
      token,
      payload,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      needsRefresh,
      expiryDate: payload?.exp ? new Date(payload.exp * 1000) : null,
      isValid: !needsRefresh,
      timeUntilExpiryMinutes: Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60)))
    };
  }, []);

  return getStatus();
}

// Hook for manual token operations
export function useTokenOperations() {
  const refreshToken = useCallback(() => {
    try {
      const newToken = tokenManager.forceRefresh();
      return { success: true, token: newToken };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }, []);

  const validateToken = useCallback((token: string) => {
    return tokenManager.validateToken(token);
  }, []);

  const checkExpiry = useCallback((token: string, bufferMinutes = 5) => {
    return tokenManager.isTokenExpired(token, bufferMinutes);
  }, []);

  return {
    refreshToken,
    validateToken,
    checkExpiry,
    getValidToken: tokenManager.getValidToken.bind(tokenManager)
  };
}