import { useEffect, useRef, useState } from "react";

function AnimatedNumber({
  value,
  duration = 700,
  decimals,
  prefix = "",
  suffix = "",
  formatter,
}) {
  const parsedValue = Number(value);
  const targetValue = Number.isFinite(parsedValue) ? parsedValue : 0;

  const previousValueRef = useRef(0);
  const animationFrameRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setDisplayValue(targetValue);
      previousValueRef.current = targetValue;
      return undefined;
    }

    const startValue = previousValueRef.current;
    const difference = targetValue - startValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        previousValueRef.current = targetValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  const resolvedDecimals =
    typeof decimals === "number"
      ? decimals
      : Number.isInteger(targetValue)
      ? 0
      : 1;

  const formattedValue =
    typeof formatter === "function"
      ? formatter(displayValue)
      : displayValue.toLocaleString(undefined, {
          minimumFractionDigits: resolvedDecimals,
          maximumFractionDigits: resolvedDecimals,
        });

  return (
    <span>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;