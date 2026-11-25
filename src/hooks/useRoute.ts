import { useCallback, useSyncExternalStore } from 'react';

export const ROUTES = ['home', 'words', 'study', 'test', 'grammar', 'add'] as const;
export type Route = (typeof ROUTES)[number];

function read(): Route {
  const name = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): [Route, (r: Route) => void] {
  const route = useSyncExternalStore(subscribe, read, () => 'home' as Route);
  const go = useCallback((r: Route) => {
    window.location.hash = `/${r}`;
    window.scrollTo(0, 0);
  }, []);
  return [route, go];
}
