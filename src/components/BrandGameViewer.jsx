import React, { useState } from 'react';
import { Pause } from 'lucide-react';
import './BrandGameViewer.css';

function BrandGameViewer({ game, onClose }) {
  const [isPaused, setIsPaused] = useState(false);

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

      {/* Full-screen game iframe */}
      <iframe
        src={game.url}
        className="bgv-iframe"
        title={game.name}
        allow="fullscreen; autoplay; gyroscope; accelerometer; encrypted-media"
        style={game?.isExclusive && isPaused ? { display: 'none' } : {}}
      />
    </div>
  );
}

export default BrandGameViewer;
