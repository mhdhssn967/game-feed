import React, { useState, useEffect, useRef } from 'react';
import GameFeed from './components/GameFeed';
import BrandZone from './components/BrandZone';
import NavigationArrows from './components/NavigationArrows';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [page, setPage] = useState('feed'); // 'feed' | 'brandZone' | 'profile' | 'login'
  const [navState, setNavState] = useState({ disableUp: true, disableDown: false });
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

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
          <div className="safe-area-panel"></div>
          {/* Top Navbar */}
          <div className="top-navbar">
            <div className="navbar-left">
              <div className="navbar-logo">
                <img src="/gflogo.png" alt="GameFaktory" height="24" style={{ filter: 'invert(1)' }} />
              </div>
            </div>

            <div className="navbar-center">
            </div>
            
            <div className="navbar-right" style={{ gap: '12px' }}>
              <button className="nav-btn bz-special-btn" onClick={() => setPage('brandZone')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 2 }}>
                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                  <rect x="2" y="7" width="20" height="5"></rect>
                  <line x1="12" y1="22" x2="12" y2="7"></line>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
                <div className="bz-glow"></div>
              </button>
              <button 
                className="nav-btn profile-icon-btn" 
                onClick={() => {
                  if (currentUser) {
                    setSelectedUser({
                      id: currentUser.uid,
                      name: currentUser.displayName || 'Anonymous Player',
                      logo: currentUser.photoURL || null
                    });
                    setPage('profile');
                  } else {
                    setPage('login');
                  }
                }}
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="nav-profile-pic" />
                ) : (
                  <div className="nav-profile-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
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
        <UserProfile 
          user={selectedUser} 
          isCurrentUser={currentUser && currentUser.uid === selectedUser.id}
          onClose={() => setPage('feed')} 
        />
      )}

      {/* Login Screen overlays everything */}
      {page === 'login' && (
        <Login onLogin={() => {
          setPage('profile');
          setSelectedUser({
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || 'Anonymous Player',
            logo: auth.currentUser.photoURL || null
          });
        }} onClose={() => setPage('feed')} />
      )}
    </div>
  );
}

export default App;
