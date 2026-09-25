import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './GameCard.css';

function GameCard({ game, url: fallbackUrl, shouldLoad, onProfileClick }) {
  const url = game?.link || game?.url || fallbackUrl;
  const developerName = game?.addedByName || game?.developer || 'Unknown User';
  const likes = game?.likes || Math.floor(Math.random() * 50) + 10 + 'k';
  const comments = game?.comments || Math.floor(Math.random() * 900) + 100;

  const [developerLogo, setDeveloperLogo] = useState(null);
  const [showHud, setShowHud] = useState(true);
  const idleTimerRef = useRef(null);
  const initialHideTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Fast fallback: if this game belongs to the currently logged in user, use their auth picture!
    if (auth.currentUser && game?.addedByUserId === auth.currentUser.uid && auth.currentUser.photoURL) {
      setDeveloperLogo(auth.currentUser.photoURL);
    }

    if (game?.addedByUserId) {
      getDoc(doc(db, 'users', game.addedByUserId)).then(snap => {
        if (isMounted && snap.exists() && snap.data().logo) {
          setDeveloperLogo(snap.data().logo);
        }
      });
    }

    return () => { isMounted = false; };
  }, [game]);

  const resetIdleTimer = () => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowHud(true);
    }, 3000);
  };

  useEffect(() => {
    if (!shouldLoad) return;
    
    // Initial logic: show for 2s, then hide
    setShowHud(true);
    initialHideTimerRef.current = setTimeout(() => {
      setShowHud(false);
      resetIdleTimer();
    }, 2000);

    const handleInteraction = (e) => {
      // Don't hide if interacting with the HUD itself
      if (e?.target?.closest && (e.target.closest('.game-top-bar') || e.target.closest('.game-overlay'))) {
        resetIdleTimer();
        return;
      }
      
      // Hide on touch
      setShowHud(false);
      resetIdleTimer();
    };
    
    window.addEventListener('touchstart', handleInteraction, { capture: true });
    window.addEventListener('mousedown', handleInteraction, { capture: true });
    window.addEventListener('keydown', handleInteraction, { capture: true });
    
    const handleBlur = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        handleInteraction({});
      }
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      clearTimeout(initialHideTimerRef.current);
      clearTimeout(idleTimerRef.current);
      window.removeEventListener('touchstart', handleInteraction, { capture: true });
      window.removeEventListener('mousedown', handleInteraction, { capture: true });
      window.removeEventListener('keydown', handleInteraction, { capture: true });
      window.removeEventListener('blur', handleBlur);
    };
  }, [shouldLoad]);

  const handleDevClick = (e) => {
    e.stopPropagation();
    if (onProfileClick) {
      onProfileClick({
        id: game?.addedByUserId || game?.id || 'unknown',
        name: developerName,
        logo: developerLogo
      });
    }
  };

  return (
    <div className="game-card">
      {shouldLoad ? (
        <iframe
          src={url}
          className="game-iframe"
          title={url}
          allow="fullscreen; autoplay; gyroscope; accelerometer; encrypted-media"
          loading="lazy"
        />
      ) : (
        <div className="game-placeholder" />
      )}

      {/* ── Top Bar (User Info) ── */}
      <div className={`game-top-bar ${showHud ? 'visible' : 'hidden'}`}>
        <div className="dev-info-compact" onClick={handleDevClick} style={{ cursor: 'pointer' }}>
          <div className="dev-profile-pic-small" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a224a', color: '#a78bfa' }}>
            {developerLogo ? (
              <img src={developerLogo} alt={developerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <span className="dev-name-small">{developerName}</span>
        </div>
        <button className="follow-btn-small">Follow</button>
      </div>

      {/* ── Overlay UI (Engagement Actions) ── */}
      <div className={`game-overlay ${showHud ? 'visible' : 'hidden'}`}>
        <div className="action-buttons-col">
          <button className="action-btn">
            <Heart className="action-icon" size={28} color="#fff" />
            <span className="action-text">{likes}</span>
          </button>
          <button className="action-btn">
            <MessageCircle className="action-icon" size={28} color="#fff" />
            <span className="action-text">{comments}</span>
          </button>
          <button className="action-btn">
            <Bookmark className="action-icon" size={28} color="#fff" />
            <span className="action-text">Save</span>
          </button>
          <button className="action-btn">
            <Share2 className="action-icon" size={28} color="#fff" />
            <span className="action-text">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
