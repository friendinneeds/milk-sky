import { useEffect } from 'react';
import { db } from './db';
import { introduceUpToQuota } from './db/words';
import { useRoute } from './hooks/useRoute';
import { TabBar } from './components/TabBar';
import { Home } from './screens/Home';
import { Words } from './screens/Words';
import { AddWords } from './screens/AddWords';
import { Coming } from './screens/Coming';

export function App() {
  const [route, go] = useRoute();

  // Release today's new words on start, and again when the app is reopened
  // the next day without a full reload.
  useEffect(() => {
    const run = () => void introduceUpToQuota(db);
    run();
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    // Ask the browser not to evict our data. Harmless if it says no.
    void navigator.storage?.persist?.();
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <div className="app">
      {route === 'home' && <Home go={go} />}
      {route === 'words' && <Words go={go} />}
      {route === 'add' && <AddWords go={go} />}
      {route === 'study' && <Coming title="Study" text="Flashcards and the daily session arrive in the next build step." />}
      {route === 'test' && <Coming title="Test" text="Tests arrive after the flashcards." />}
      {route === 'grammar' && <Coming title="Grammar" text="Grammar lessons arrive in the last build step." />}
      {route !== 'add' && <TabBar route={route} go={go} />}
    </div>
  );
}
