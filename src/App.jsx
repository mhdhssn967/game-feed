import React, { useState, useEffect, useRef } from 'react';
import GameFeed from './components/GameFeed';
import BrandZone from './components/BrandZone';
import NavigationArrows from './components/NavigationArrows';
import './App.css';

function App() {
  const [page, setPage] = useState('feed');
  const [navState, setNavState] = useState({ disableUp: true, disableDown: false });
  const feedRef = useRef(null);

  // Sync nav disabled state whenever feed ref updates
  const syncNav = () => {
    const f = feedRef.current;
    if (!f) return;
    setNavState({ disableUp: f.disableUp, disableDown: f.disableDown });
  };

  const handleUp = () => {
    feedRef.current?.goUp();
    setTimeout(syncNav, 20);
  };
  const handleDown = () => {
    feedRef.current?.goDown();
    setTimeout(syncNav, 20);
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({ immediate: true });
      });
    }
  }, []);

  return (
    <div className="app-root">
      {/* Game slots — isolated stacking context, no animated UI inside */}
      <GameFeed ref={feedRef} />

      {/* ── Floating UI lives HERE in root stacking context ──
          These are ABOVE game-feed (z-index: 0) but NOT inside its compositor layer.
          This prevents the animated brand-zone-btn from blocking touch in the iframe. */}
      {page === 'feed' && (
        <>
          {/* Brand Zone 3D gift button */}
          <button
            className="brand-zone-btn"
            onClick={() => setPage('brandZone')}
            aria-label="Brand Zone – play & earn rewards"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" rx="1" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </button>

          {/* Navigation chevrons */}
          <NavigationArrows
            onUp={handleUp}
            onDown={handleDown}
            disableUp={navState.disableUp}
            disableDown={navState.disableDown}
          />
        </>
      )}

      {/* Brand Zone overlays everything */}
      {page === 'brandZone' && (
        <BrandZone onClose={() => setPage('feed')} />
      )}
    </div>
  );
}

export default App;
