import React, { useState, useEffect, useRef } from 'react';
import GameFeed from './components/GameFeed';
import BrandZone from './components/BrandZone';
import NavigationArrows from './components/NavigationArrows';
import UserProfile from './components/UserProfile';
import DeveloperDashboard from './components/DeveloperDashboard';
import Login from './components/Login';
import GFCoinModal from './components/GFCoinModal';
import PWAInstallModal from './components/PWAInstallModal';
import { auth, db, functions, DEFAULT_AVATAR } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [page, setPage] = useState('loading'); // 'loading' | 'feed' | 'brandZone' | 'profile' | 'login'
  const [navState, setNavState] = useState({ disableUp: true, disableDown: false });
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [isPlayingGame, setIsPlayingGame] = useState(true);
  const [playtimeSeconds, setPlaytimeSeconds] = useState(0);
  const feedRef = useRef(null);

  const initialGameId = new URLSearchParams(window.location.search).get('game');

  useEffect(() => {
    let userSub;
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        userSub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            if (docSnap.data().isDeveloper) {
              setIsDeveloper(true);
            } else {
              setIsDeveloper(false);
            }
          } else {
            setUserData({});
            setIsDeveloper(false);
          }
        });
        
        setPage((p) => (p === 'login' || p === 'loading' ? 'feed' : p));
      } else {
        if (userSub) userSub();
        setUserData(null);
        setIsDeveloper(false);
        setPage('login');
      }
    });
    return () => {
      unsub();
      if (userSub) userSub();
    };
  }, []);

  useEffect(() => {
    if (userData && !userData.onboardingClaimed && !window.onboardingShown) {
      window.onboardingShown = true;
      const claimGift = async () => {
        const result = await Swal.fire({
          title: 'Welcome to GameFaktory!',
          text: "Here is your 50 Coins onboarding gift to get you started!",
          imageUrl: '/gfcoin.webp',
          imageWidth: 80,
          imageHeight: 80,
          confirmButtonText: 'Claim Gift',
          confirmButtonColor: '#8b5cf6',
          background: '#1c1c24',
          color: '#fff',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
        
        if (result.isConfirmed) {
          try {
            Swal.fire({ title: 'Claiming...', background: '#1c1c24', color: '#fff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const processReferral = httpsCallable(functions, 'processReferralCode');
            const response = await processReferral({});
            await Swal.fire({
              title: 'Gift Claimed! 🎉',
              html: `
                <div style="padding: 10px 0;">
                  <h2 style="font-size: 32px; font-weight: bold; color: #a78bfa; margin: 0 0 10px;">${response.data.validReferral ? '75' : '50'} GF Coins</h2>
                  <p style="font-size: 16px; color: #d4d4d8;">${response.data.validReferral ? 'You got 50 Coins + 25 Bonus from your referral code!' : 'You got 50 Coins to kickstart your journey!'}</p>
                </div>
              `,
              imageUrl: '/gfcoin.webp',
              imageWidth: 80,
              imageHeight: 80,
              confirmButtonText: 'Next',
              confirmButtonColor: '#8b5cf6',
              background: '#1c1c24',
              color: '#fff',
              allowOutsideClick: false,
              allowEscapeKey: false
            });

            await Swal.fire({
              title: 'Play & Earn',
              html: `
                <div style="padding: 10px 0;">
                  <h3 style="font-size: 24px; font-weight: bold; color: #fff; margin: 0 0 10px;">Time is Money</h3>
                  <p style="font-size: 16px; color: #d4d4d8; line-height: 1.6;">
                    For every <strong>5 minutes</strong> you spend playing games or exploring the app, you will automatically earn <strong>1 GF Coin</strong>. 
                  </p>
                </div>
              `,
              icon: 'info',
              iconColor: '#8b5cf6',
              confirmButtonText: 'Next',
              confirmButtonColor: '#8b5cf6',
              background: '#1c1c24',
              color: '#fff',
              allowOutsideClick: false,
              allowEscapeKey: false
            });

            await Swal.fire({
              title: 'Real Rewards',
              html: `
                <div style="padding: 10px 0;">
                  <h3 style="font-size: 24px; font-weight: bold; color: #fff; margin: 0 0 10px;">Brand Games</h3>
                  <p style="font-size: 16px; color: #d4d4d8; line-height: 1.6;">
                    Use your hard-earned GF Coins to play exclusive brand games. Win these games to earn <strong>real-world rewards</strong> and prizes!
                  </p>
                </div>
              `,
              icon: 'success',
              iconColor: '#10b981',
              confirmButtonText: "Let's Play!",
              confirmButtonColor: '#8b5cf6',
              background: '#1c1c24',
              color: '#fff',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
          } catch (e) {
            Swal.fire({ title: 'Error', text: 'Could not claim gift.', icon: 'error', background: '#1c1c24', color: '#fff' });
            window.onboardingShown = false;
          }
        }
      };
      claimGift();
    }
  }, [userData]);

  // Handle page changes for isPlayingGame
  useEffect(() => {
    if (page === 'feed') {
      setIsPlayingGame(true);
    } else if (page !== 'brandZone') {
      // For profile, dev dashboard, login, they are not playing
      setIsPlayingGame(false);
    }
  }, [page]);

  const playtimeSecondsRef = useRef(parseInt(localStorage.getItem('gf_playtime_seconds') || '0', 10));

  // Award 1 coin for every 5 minutes spent actively playing
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      // Only advance the timer if the user is actively viewing the tab AND playing a game
      if (document.visibilityState === 'visible' && isPlayingGame) {
        playtimeSecondsRef.current += 1;
        
        if (playtimeSecondsRef.current >= 300) {
          playtimeSecondsRef.current = 0;
          const awardPlaytimeCoin = httpsCallable(functions, 'awardPlaytimeCoin');
          awardPlaytimeCoin().catch((err) => console.error("Failed to award playtime coin:", err));
        }
        
        localStorage.setItem('gf_playtime_seconds', playtimeSecondsRef.current.toString());
        setPlaytimeSeconds(playtimeSecondsRef.current);
      }
    }, 1000); // Tick every 1 second

    return () => clearInterval(interval);
  }, [currentUser, isPlayingGame]);

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

  const handleProfileClick = (user, forceDevDashboard = false) => {
    setSelectedUser(user);
    if (forceDevDashboard) {
      setPage('publicDeveloperDashboard');
    } else {
      setPage('profile');
    }
  };

  const handlePlayGameInFeed = (gameId) => {
    setPage('feed');
    feedRef.current?.playSpecificGame(gameId);
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
      <GameFeed ref={feedRef} onProfileClick={handleProfileClick} initialGameId={initialGameId} userData={userData} />

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

            <div className="navbar-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      logo: currentUser.photoURL || DEFAULT_AVATAR
                    });
                    setPage('profile');
                  } else {
                    setPage('login');
                  }
                }}
              >
                <img src={currentUser?.photoURL || DEFAULT_AVATAR} alt="Profile" className="nav-profile-pic" />
              </button>

              {/* GF Coin Display */}
              <div 
                style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '4px 10px 4px 6px', borderRadius: '20px', gap: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => setShowCoinModal(true)}
              >
                <img src="/gfcoin.webp" alt="GF Coin" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold' }}>{userData?.coins || 0}</span>
              </div>
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
        <BrandZone 
          onClose={() => setPage('feed')} 
          onPlayStateChange={(isPlay) => setIsPlayingGame(isPlay)}
          userData={userData}
        />
      )}

      {/* User Profile overlays everything */}
      {page === 'profile' && selectedUser && (
        <UserProfile 
          user={selectedUser} 
          isCurrentUser={currentUser && currentUser.uid === selectedUser.id}
          isDeveloper={isDeveloper}
          onOpenDevDashboard={() => setPage('developerDashboard')}
          onBecomeDeveloper={async () => {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { isDeveloper: true }, { merge: true });
            setIsDeveloper(true);
            setPage('developerDashboard');
          }}
          onClose={() => setPage('feed')} 
          onPlayGameInFeed={handlePlayGameInFeed}
        />
      )}

      {page === 'developerDashboard' && currentUser && (
        <DeveloperDashboard 
          user={{ id: currentUser.uid, name: currentUser.displayName || 'Dev' }} 
          isCurrentUser={true}
          onClose={() => setPage('feed')}
          onPlayGameInFeed={handlePlayGameInFeed}
        />
      )}

      {page === 'publicDeveloperDashboard' && selectedUser && (
        <DeveloperDashboard 
          user={selectedUser} 
          isCurrentUser={currentUser && currentUser.uid === selectedUser.id}
          onClose={() => setPage('feed')}
          onPlayGameInFeed={handlePlayGameInFeed}
        />
      )}

      {/* Login Screen overlays everything */}
      {page === 'login' && (
        <Login onLogin={() => {
          setPage('feed');
        }} mandatory={true} />
      )}

      {/* Loading Screen */}
      {page === 'loading' && (
        <div style={{ position: 'fixed', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
          <img src="/gflogo.png" alt="Loading" style={{ filter: 'invert(1)', width: '64px', animation: 'pulse 1.5s infinite' }} />
        </div>
      )}

      {showCoinModal && (
        <GFCoinModal 
          onClose={() => setShowCoinModal(false)} 
          currentUser={currentUser} 
          userData={userData} 
          playtimeSeconds={playtimeSeconds}
        />
      )}

      <PWAInstallModal />
    </div>
  );
}

export default App;
