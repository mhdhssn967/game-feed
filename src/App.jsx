import React, { useState, useEffect, useRef } from 'react';
import GameFeed from './components/GameFeed';
import BrandZone from './components/BrandZone';
import NavigationArrows from './components/NavigationArrows';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  const [page, setPage] = useState('feed'); // 'feed' | 'brandZone' | 'profile'
  const [navState, setNavState] = useState({ disableUp: true, disableDown: false });
  const [selectedUser, setSelectedUser] = useState(null);
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

  const handleProfileClick = (user) => {
    setSelectedUser(user);
    setPage('profile');
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
      <GameFeed ref={feedRef} onProfileClick={handleProfileClick} />

      {/* ── Floating UI lives HERE in root stacking context ──
          These are ABOVE game-feed (z-index: 0) but NOT inside its compositor layer.
          This prevents the animated brand-zone-btn from blocking touch in the iframe. */}
      {page === 'feed' && (
        <>
          {/* Top Navbar */}
          <div className="top-navbar">
            <div className="navbar-left">
              <div className="navbar-logo">
                <img src="/gflogo.png" alt="GameFaktory" height="24" style={{ filter: 'invert(1)' }} />
              </div>
            </div>

            <div className="navbar-center">
            </div>
            
            <div className="navbar-right">
              <button className="nav-btn bz-special-btn" onClick={() => setPage('brandZone')}>
                <span className="bz-text">BRAND ZONE</span>
                <div className="bz-glow"></div>
              </button>
            </div>
          </div>

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

      {/* User Profile overlays everything */}
      {page === 'profile' && selectedUser && (
        <UserProfile user={selectedUser} onClose={() => setPage('feed')} />
      )}
    </div>
  );
}

export default App;
