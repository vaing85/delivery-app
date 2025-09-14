import { useState, useCallback } from 'react';

interface SwipeState {
  x: number;
  y: number;
}

export const useMobileInteractions = () => {
  const [swipeStart, setSwipeStart] = useState<SwipeState | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setSwipeStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStart || e.touches.length !== 1) return;
    
    const currentTouch = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    
    const deltaX = currentTouch.x - swipeStart.x;
    const deltaY = Math.abs(currentTouch.y - swipeStart.y);
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      // Prevent default scrolling behavior for horizontal swipes
      e.preventDefault();
    }
  }, [swipeStart]);

  const handleTouchEnd = useCallback(() => {
    setSwipeStart(null);
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipeStart,
  };
};
