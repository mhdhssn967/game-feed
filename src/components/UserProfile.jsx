import React, { useState, useEffect } from 'react';
import { subscribeToFeedGames } from '../firebase';
import './UserProfile.css';

function UserProfile({ user, onClose }) {
  const [games, setGames] = useState([]);
  
  useEffect(() => {
    const unsubscribe = subscribeToFeedGames((fetchedGames) => {
      // Filter games by this user
      if (fetchedGames) {
        const userGames = fetchedGames.filter(g => g.addedByUserId === user.id || g.addedByName === user.name);
        setGames(userGames);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

  return (
    <div className="user-profile-page">
      {/* Dynamic Cover Area */}
      <div className="up-cover">
        <button className="up-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="up-cover-gradient"></div>
      </div>

      <div className="up-content">
        {/* Profile Header */}
        <div className="up-profile-header">
          <div className="up-avatar-wrapper">
            <img src={user.logo} alt={user.name} className="up-avatar" />
          </div>
          <h2 className="up-username">{user.name}</h2>
          <p className="up-bio-text">Game developer crafting fun web experiences. 🎮 Let's play!</p>
        </div>

        {/* Stats Glass Pill */}
        <div className="up-stats-glass">
          <div className="up-stat">
            <span className="up-stat-val">{games.length}</span>
            <span className="up-stat-lbl">Games</span>
          </div>
          <div className="up-stat-divider"></div>
          <div className="up-stat">
            <span className="up-stat-val">{Math.floor(Math.random() * 50) + 10}k</span>
            <span className="up-stat-lbl">Followers</span>
          </div>
          <div className="up-stat-divider"></div>
          <div className="up-stat">
            <span className="up-stat-val">{Math.floor(Math.random() * 100) + 20}</span>
            <span className="up-stat-lbl">Following</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="up-actions">
          <button className="up-btn-primary">Follow User</button>
          <button className="up-btn-secondary">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>

        {/* Games Library */}
        <div className="up-library">
          <h3 className="up-library-title">Library</h3>
          <div className="up-cards-grid">
            {games.map(g => (
              <div className="up-game-card" key={g.id}>
                {g.thumbnail ? (
                  <img src={g.thumbnail} alt={g.title} className="up-game-img" />
                ) : (
                  <div className="up-game-placeholder">
                    <span className="up-placeholder-icon">👾</span>
                  </div>
                )}
                <div className="up-game-info">
                  <span className="up-game-title">{g.title}</span>
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="up-no-games">No games found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
