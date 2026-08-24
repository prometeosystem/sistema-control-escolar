"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mantiene `active` en true durante al menos `minMs`. Con la API en local las
 * respuestas llegan en decenas de milisegundos y el loader alcanzaba a pintarse
 * un solo frame, así que se percibía como un parpadeo.
 */
export function useMinDuration(active: boolean, minMs = 550): boolean {
  const [held, setHeld] = useState(active);
  const startedAt = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      startedAt.current = Date.now();
      setHeld(true);
      return;
    }
    if (startedAt.current === null) {
      setHeld(false);
      return;
    }
    const remaining = minMs - (Date.now() - startedAt.current);
    if (remaining <= 0) {
      startedAt.current = null;
      setHeld(false);
      return;
    }
    const timer = setTimeout(() => {
      startedAt.current = null;
      setHeld(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [active, minMs]);

  return held;
}
