import React, { useState } from 'react';
import { Pause, Lock } from 'lucide-react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import Swal from 'sweetalert2';
import './BrandGameViewer.css';

function BrandGameViewer({ game, onClose, userData }) {
  const [isPaused, setIsPaused] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    try {
      const userLives = userData?.lives || 0;
      if (userLives > 0) {
        const consumeLife = httpsCallable(functions, 'consumeLife');
        await consumeLife();
        setIsUnlocked(true);
      } else {
        const userCoins = userData?.coins || 0;
        if (userCoins >= 10) {
          const purchaseLife = httpsCallable(functions, 'purchaseLife');
          await purchaseLife();
          const consumeLife = httpsCallable(functions, 'consumeLife');
          await consumeLife();
          setIsUnlocked(true);
        } else {
          Swal.fire({
            title: 'Not Enough Coins!',
            text: 'You need 10 coins to buy a life to play this exclusive game. Keep playing other games to earn more!',
            icon: 'error',
            background: '#1c1c24',
            color: '#fff'
          });
        }
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', e.message || 'Could not unlock game', 'error');
    }
    setIsUnlocking(false);
  };

  return (
    <div className="bgv-shell">
      {/* Thin top bar */}
      {!game?.isExclusive && (
        <div className="bgv-bar" style={{ background: game.accent }}>
          <button className="bgv-close-btn" onClick={onClose} aria-label="Close game">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="bgv-brand-name">{game.name}</span>
          <span className="bgv-earn-badge">🎁 Earn Rewards</span>
        </div>
      )}

      {/* ── Exclusive Mode Overlays ── */}
      {game?.isExclusive && (
        <button 
          onClick={() => setIsPaused(true)}
          style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100000, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white', cursor: 'pointer' }}
        >
          <Pause size={24} />
        </button>
      )}

      {game?.isExclusive && isPaused && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <h2 style={{ color: '#fff', fontSize: '32px', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>PAUSED</h2>
          <button 
            onClick={() => setIsPaused(false)}
            style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            RESUME
          </button>
          <button 
            onClick={() => {
              setIsPaused(false);
              onClose();
            }}
            style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '15px 40px', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            QUIT
          </button>
        </div>
      )}

      {/* Full-screen game iframe or Lock Screen */}
      {(game?.isExclusive && !isUnlocked) ? (
        <div className="exclusive-lock-screen" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0d0d 0%, #1c1c24 100%)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <Lock size={64} color="#a78bfa" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Outfit, sans-serif', marginBottom: '10px' }}>Exclusive Game</h2>
          <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>Unlock gameplays using your coins.</p>
          
          <button 
            onClick={handleUnlock}
            disabled={isUnlocking}
            style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {isUnlocking ? 'Processing...' : (userData?.lives > 0 ? 'Unlock Game (-1 Life)' : 'Buy 1 Life (10 Coins)')}
          </button>
        </div>
      ) : (
        <iframe
          src={game.url}
          className="bgv-iframe"
          title={game.name}
          allow="fullscreen; autoplay; gyroscope; accelerometer; encrypted-media"
          style={game?.isExclusive && isPaused ? { display: 'none' } : {}}
        />
      )}
    </div>
  );
}

export default BrandGameViewer;
