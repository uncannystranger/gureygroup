import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter Component
 * Animates counting numbers smoothly from start to target value.
 * Respects prefers-reduced-motion.
 */
export default function AnimatedCounter({ 
  value, 
  duration = 350, 
  prefix = '', 
  suffix = '', 
  decimals = 0, 
  className = '' 
}) {
  // Extract number from string if needed (e.g. "$12,450.00" or 142)
  const numericValue = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  const [displayValue, setDisplayValue] = useState(numericValue);
  const startValueRef = useRef(numericValue);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(numericValue);
      return;
    }

    const startVal = displayValue;
    const endVal = numericValue;
    if (startVal === endVal) return;

    startValueRef.current = startVal;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Cubic ease-out: 1 - Math.pow(1 - progress, 3)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numericValue, duration]);

  const formattedNumber = decimals > 0 
    ? displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={className}>
      {prefix}{formattedNumber}{suffix}
    </span>
  );
}
