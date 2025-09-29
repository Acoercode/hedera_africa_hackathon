import { useEffect, useRef } from "react";

interface AppStateCallbacks {
  onAppActive?: () => void;
  onAppInactive?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const useAppState = (callbacks: AppStateCallbacks) => {
  const { onAppActive, onAppInactive, onVisibilityChange } = callbacks;
  const isActiveRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      if (isVisible && !isActiveRef.current) {
        // App became active
        isActiveRef.current = true;
        onAppActive?.();
      } else if (!isVisible && isActiveRef.current) {
        // App became inactive
        isActiveRef.current = false;
        onAppInactive?.();
      }

      onVisibilityChange?.(isVisible);
    };

    const handleFocus = () => {
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        onAppActive?.();
      }
    };

    const handleBlur = () => {
      if (isActiveRef.current) {
        isActiveRef.current = false;
        onAppInactive?.();
      }
    };

    // Listen for visibility changes (most reliable for mobile)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Fallback for older browsers
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Check initial state
    handleVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [onAppActive, onAppInactive, onVisibilityChange]);

  return {
    isActive: isActiveRef.current,
  };
};
