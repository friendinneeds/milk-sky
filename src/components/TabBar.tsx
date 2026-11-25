import type { ReactNode } from 'react';
import type { Route } from '../hooks/useRoute';
import { BookIcon, CardsIcon, CheckCircleIcon, HomeIcon, LinesIcon } from './Icons';

const TABS: { route: Route; label: string; icon: ReactNode }[] = [
  { route: 'home', label: 'Home', icon: <HomeIcon /> },
  { route: 'words', label: 'Words', icon: <BookIcon /> },
  { route: 'study', label: 'Study', icon: <CardsIcon /> },
  { route: 'test', label: 'Test', icon: <CheckCircleIcon /> },
  { route: 'grammar', label: 'Grammar', icon: <LinesIcon /> },
];

export function TabBar({ route, go }: { route: Route; go: (r: Route) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.route}
          className="tab"
          aria-current={route === t.route ? 'page' : undefined}
          onClick={() => go(t.route)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  );
}
