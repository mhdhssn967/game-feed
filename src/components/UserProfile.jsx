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
      {/* Header */}
      <div className="up-header">
        <button className="up-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="up-username">{user.name}</span>
      </div>

      {/* Profile Info */}
      <div className="up-info">
        <div className="up-avatar-container">
          <img src={user.logo} alt={user.name} className="up-avatar" />
        </div>
        <div className="up-stats">
          <div className="up-stat">
            <span className="up-stat-val">{games.length}</span>
            <span className="up-stat-lbl">Games</span>
          </div>
          <div className="up-stat">
            <span className="up-stat-val">{Math.floor(Math.random() * 50) + 10}k</span>
            <span className="up-stat-lbl">Followers</span>
          </div>
          <div className="up-stat">
            <span className="up-stat-val">{Math.floor(Math.random() * 100) + 20}</span>
            <span className="up-stat-lbl">Following</span>
          </div>
        </div>
      </div>
      
      <div className="up-bio">
        <span className="up-bio-name">{user.name}</span>
        <p className="up-bio-text">Game developer crafting fun web experiences. 🎮 Let's play!</p>
      </div>

      <div className="up-actions">
        <button className="up-action-btn up-follow">Follow</button>
        <button className="up-action-btn up-message">Message</button>
      </div>

      {/* Posts/Games Grid */}
      <div className="up-tabs">
        <div className="up-tab active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
      </div>

      <div className="up-grid">
        {games.map(g => (
          <div className="up-grid-item" key={g.id}>
            {g.thumbnail ? (
              <img src={g.thumbnail} alt={g.title} className="up-grid-img" />
            ) : (
              <div className="up-grid-placeholder">
                 <span className="up-grid-title">{g.title}</span>
              </div>
            )}
          </div>
        ))}
        {games.length === 0 && (
          <div className="up-no-games">No games uploaded yet.</div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
