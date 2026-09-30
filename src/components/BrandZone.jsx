import React, { useState, useEffect } from 'react';
import { brandGames } from '../data/games';
import BrandGameViewer from './BrandGameViewer';
import './BrandZone.css';

function BrandZone({ onClose, onPlayStateChange, userData }) {
  const [activeGame, setActiveGame] = useState(null);

  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(!!activeGame);
    }
  }, [activeGame, onPlayStateChange]);

  if (activeGame) {
    return (
      <BrandGameViewer
        game={activeGame}
        onClose={() => setActiveGame(null)}
        userData={userData}
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
      <div className="bz-banner" style={{ margin: '0 0 20px 0', padding: 0, borderRadius: 0, overflow: 'hidden', background: 'transparent', minHeight: 'auto' }}>
        <img 
          src="/image%20copy.png" 
          alt="Play Win Redeem" 
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} 
        />
      </div>

      {/* ── Exclusive Games Section ── */}
      <div style={{ padding: '10px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Section Divider & Heading */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, transparent, #d4c8ff)' }}></div>
          <h2 style={{
            fontFamily: "'Luckiest Guy', cursive",
            fontSize: '22px',
            color: '#5b4f8a',
            letterSpacing: '1.5px',
            margin: '0 16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            EXCLUSIVE DROPS
          </h2>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, transparent, #d4c8ff)' }}></div>
        </div>

        {/* Premium Game Card */}
        <button 
          className="brand-card" 
          style={{ 
            width: '100%', padding: '0', 
            background: '#000', border: 'none', 
            position: 'relative', overflow: 'hidden', borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(26, 17, 64, 0.25)',
            display: 'block'
          }}
          onClick={() => setActiveGame({ id: 'altosescape', name: "Alto's Slide", url: "https://altos-slide.vercel.app/", isExclusive: true })}
        >
          <img 
            src="/altosescape.webp" 
            alt="Alto's Escape" 
            style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.4s ease' }} 
          />
          
          {/* Gradient Overlay & Text */}
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)', 
            padding: '30px 20px 16px', textAlign: 'left',
            display: 'flex', flexDirection: 'column', gap: '2px'
          }}>
            <span style={{ 
              color: '#facc15', fontSize: '10px', fontWeight: '800', 
              letterSpacing: '1px', textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}>
              Featured Event
            </span>
            <h3 style={{ 
              fontFamily: "'Luckiest Guy', cursive", 
              fontSize: '22px', color: '#fff', margin: 0, letterSpacing: '1px',
              textShadow: '0 2px 6px rgba(0,0,0,0.6)',
              lineHeight: '1.1'
            }}>
              ALTO'S ESCAPE
            </h3>
            <span style={{ color: '#e4e4e7', fontSize: '12px', fontWeight: '500', opacity: 0.9 }}>
              Play now and earn premium rewards!
            </span>
          </div>

          {/* Floating Play Icon */}
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ marginLeft: '4px' }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </button>

        {/* TEMPORARILY HIDDEN CARDS
        {brandGames.map((game) => (
          <button
            key={game.id}
            className="brand-card"
            onClick={() => setActiveGame(game)}
            aria-label={`Play ${game.name}`}
          >
            <span className="card-star card-star--tl">⭐</span>
            <span className="card-star card-star--tr">✦</span>

            <div className="brand-icon" style={{ background: game.accent, display: 'none' }}>
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
        */}
      </div>

    </div>
  );
}

export default BrandZone;
