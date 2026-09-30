/**
 * Gasto Buster — useMediaQuery hook.
 *
 * SSR-safe subscription to a CSS media query. Never read
 * window.innerWidth during render — declare a query and let this hook
 * mirror matchMedia state into React.
 */

import { useEffect, useState } from 'react';

/**
 * @param {string} query - A media query, e.g. '(min-width: 1024px)'.
 * @returns {boolean} Whether the query currently matches.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
