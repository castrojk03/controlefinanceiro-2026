import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

// Generate a basic device fingerprint
function generateDeviceFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '',
    (navigator as unknown as { deviceMemory?: number }).deviceMemory?.toString() || '',
  ].join('|');

  // Simple hash using btoa (for production, use crypto.subtle.digest)
  try {
    return btoa(data);
  } catch {
    return data.slice(0, 100);
  }
}

export function useSessionMonitor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const performSecureLogout = useCallback(async (reason: string) => {
    console.warn('Session invalidated:', reason);
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    toast.error(reason);
    window.location.href = '/auth';
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        await performSecureLogout('Erro ao verificar sessão');
        return;
      }

      if (!session) {
        // No session means user logged out elsewhere
        await performSecureLogout('Sessão encerrada');
        return;
      }

      // Check if session is expired
      const expiresAt = session.expires_at;
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        await performSecureLogout('Sessão expirada');
        return;
      }

      // Verify device fingerprint hasn't changed (detect session hijacking)
      const storedFingerprint = localStorage.getItem('device_fingerprint');
      const currentFingerprint = generateDeviceFingerprint();

      if (storedFingerprint && storedFingerprint !== currentFingerprint) {
        console.warn('Device fingerprint mismatch detected');
        // Don't immediately logout, but log for monitoring
        // In production, you might want to force re-authentication
      }

    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, [performSecureLogout]);

  useEffect(() => {
    // Generate and store device fingerprint on mount
    const fingerprint = generateDeviceFingerprint();
    fingerprintRef.current = fingerprint;
    
    const existingFingerprint = localStorage.getItem('device_fingerprint');
    if (!existingFingerprint) {
      localStorage.setItem('device_fingerprint', fingerprint);
    }

    // Start periodic session checks
    intervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear all data on sign out
          localStorage.clear();
          sessionStorage.clear();
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        if (event === 'USER_UPDATED') {
          console.log('User data updated');
        }
      }
    );

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      // If auth token is removed in another tab, sign out here too
      if (e.key === null || e.key?.includes('supabase')) {
        checkSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Check session on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);

  return { checkSession };
}
