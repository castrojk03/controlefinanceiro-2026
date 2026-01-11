import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivityLogout(timeoutMs: number = INACTIVITY_TIMEOUT_MS) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      toast.info('Sessão expirada por inatividade');
      
      // Force redirect to login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during inactivity logout:', error);
      window.location.href = '/auth';
    }
  }, []);

  const showWarning = useCallback(() => {
    toast.warning('Sua sessão expirará em 5 minutos por inatividade');
  }, []);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning 5 minutes before logout
    const warningTime = timeoutMs - (5 * 60 * 1000);
    if (warningTime > 0) {
      warningTimeoutRef.current = setTimeout(showWarning, warningTime);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(performLogout, timeoutMs);
  }, [timeoutMs, performLogout, showWarning]);

  useEffect(() => {
    // Events that reset the inactivity timer
    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'mousemove',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetTimer]);

  return { resetTimer };
}
