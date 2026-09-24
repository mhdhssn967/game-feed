import React from 'react';
import './BrandGameViewer.css';

function BrandGameViewer({ game, onClose }) {
  return (
    <div className="bgv-shell">
      {/* Thin top bar */}
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

      {/* Full-screen game iframe */}
      <iframe
        src={game.url}
        className="bgv-iframe"
        title={game.name}
        allow="fullscreen; autoplay; gyroscope; accelerometer; encrypted-media"
      />
    </div>
  );
}

export default BrandGameViewer;
