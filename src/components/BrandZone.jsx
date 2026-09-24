import React, { useState } from 'react';
import { brandGames } from '../data/games';
import BrandGameViewer from './BrandGameViewer';
import './BrandZone.css';

function BrandZone({ onClose }) {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame) {
    return (
      <BrandGameViewer
        game={activeGame}
        onClose={() => setActiveGame(null)}
      />
    );
  }

  return (
    <div className="brand-zone">

      {/* ── Header ── */}
      <div className="bz-header">
        <button className="bz-back-btn" onClick={onClose} aria-label="Back to feed">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <img src="/gflogo.png" alt="GameFaktory" className="bz-gf-logo" />

        {/* Coin / points button */}
        <div className="bz-coin-btn" aria-label="Your points">
          <span className="bz-coin-icon">🪙</span>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div className="bz-banner">
        {/* decorative stars */}
        <span className="bz-star bz-star--tl">⭐</span>
        <span className="bz-star bz-star--tr">✦</span>
        <span className="bz-star bz-star--bl">✦</span>

        <div className="bz-trophy">🏆</div>

        <div className="bz-banner-text">
          <div className="bz-banner-headline">
            PLAY. <span className="bz-win">WIN.</span> REDEEM.
          </div>
          <p className="bz-banner-desc">
            Complete brand games, earn points and redeem exclusive
            rewards from your favourite brands!
          </p>
        </div>
      </div>

      {/* ── Brand Grid ── */}
      <div className="bz-grid">
        {brandGames.map((game) => (
          <button
            key={game.id}
            className="brand-card"
            onClick={() => setActiveGame(game)}
            aria-label={`Play ${game.name}`}
          >
            {/* decorative sparkles per card */}
            <span className="card-star card-star--tl">⭐</span>
            <span className="card-star card-star--tr">✦</span>

            <div className="brand-icon" style={{ background: game.accent }}>
              <img
                src={game.logo}
                alt={game.name}
                className="brand-logo-img"
                draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <span className="brand-name">{game.name.toUpperCase()}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

export default BrandZone;
