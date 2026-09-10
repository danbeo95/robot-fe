'use client';

import { useState, useEffect, useRef } from 'react';

export interface UseTrackingLabelProps<T = any> {
  currentValue: T;
  prefix: string;
}

function formatTrackingLabel(prefix: string, count: number): string {
  if (!prefix) return String(count);
  const trimmed = prefix.trim();
  if (trimmed === '+') {
    return `+${count}`;
  }
  if (trimmed.endsWith('+')) {
    return `${trimmed} ${count}`;
  }
  return `${trimmed} + ${count}`;
}

/**
 * Custom hook to track updates to a value and return a formatted tracking label.
 *
 * @param props An object `{ currentValue, prefix }`
 * @returns Formatted label string `prefix + count` (e.g. "update-ram + 0")
 */
export function useTrackingLabel<T = any>({
  currentValue,
  prefix,
}: UseTrackingLabelProps<T>): string {

  const [count, setCount] = useState(0);
  const prevValueRef = useRef<T | undefined>(currentValue);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (currentValue !== undefined && currentValue !== prevValueRef.current) {
      prevValueRef.current = currentValue;
      setCount((prev) => prev + 1);
    }
  }, [currentValue]);

  return formatTrackingLabel(prefix, count);
}

export default useTrackingLabel;
