import React from 'react';
import './GameCard.css';

function GameCard({ url, shouldLoad }) {
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
    </div>
  );
}

export default GameCard;
