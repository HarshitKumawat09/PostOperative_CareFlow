'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface LongPressOptions {
  duration?: number;
  onStart?: (event: React.MouseEvent | React.TouchEvent) => void;
  onFinish?: (event: React.MouseEvent | React.TouchEvent) => void;
  onCancel?: (event: React.MouseEvent | React.TouchEvent) => void;
}

export function useLongPress(
  callback: (event: React.MouseEvent | React.TouchEvent) => void,
  {
    duration = 3000,
    onStart,
    onFinish,
    onCancel,
  }: LongPressOptions = {}
) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // This ref ensures that the `stop` function can access the latest progress value
  // without needing to be re-created on every progress update.
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const start = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    onStart?.(event);
    const startTime = Date.now();

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(newProgress);
      if (elapsedTime < duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);

    timerRef.current = setTimeout(() => {
      callback(event);
      onFinish?.(event);
      setProgress(100);
    }, duration);
  }, [callback, duration, onStart, onFinish]);

  const stop = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Check the latest progress via the ref. If it's less than 100, it means
    // the timer didn't finish, so we trigger the onCancel callback.
    if (progressRef.current < 100) {
        onCancel?.(event);
    }
    setProgress(0); // Reset progress for the next press.
  }, [onCancel]); // The 'progress' state dependency is removed here.

  return {
    progress,
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => stop(e),
    onMouseLeave: (e: React.MouseEvent) => stop(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => stop(e),
  };
}
