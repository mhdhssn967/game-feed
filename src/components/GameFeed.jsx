import React, { useState, useCallback, useRef } from 'react';
import GameCard from './GameCard';
import { commonGames } from '../data/games';
import './GameFeed.css';

// GameFeed only owns the game slots — no overlapping UI inside
const GameFeed = React.forwardRef(function GameFeed(_props, ref) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState('down');
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const navigate = useCallback((nextIndex, dir) => {
    if (animating) return;
    setDirection(dir);
    setPrevIndex(currentIndex);
    setCurrentIndex(nextIndex);
    setAnimating(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPrevIndex(null);
      setAnimating(false);
    }, 420);
  }, [animating, currentIndex]);

  // Expose nav controls to parent (App) so UI can live outside this stacking context
  React.useImperativeHandle(ref, () => ({
    goUp:       () => navigate(Math.max(0, currentIndex - 1), 'up'),
    goDown:     () => navigate(Math.min(commonGames.length - 1, currentIndex + 1), 'down'),
    disableUp:  currentIndex === 0,
    disableDown: currentIndex === commonGames.length - 1,
  }), [navigate, currentIndex]);

  const outClass = direction === 'down' ? 'slide-out-up'    : 'slide-out-down';
  const inClass  = direction === 'down' ? 'slide-in-bottom' : 'slide-in-top';

  return (
    <div className="game-feed">
      {animating && prevIndex !== null && (
        <div className={`feed-slot ${outClass}`} key={`out-${prevIndex}`}>
          <GameCard url={commonGames[prevIndex].url} shouldLoad={false} />
        </div>
      )}
      <div className={`feed-slot ${animating ? inClass : ''}`} key={`in-${currentIndex}`}>
        <GameCard url={commonGames[currentIndex].url} shouldLoad={true} />
      </div>
    </div>
  );
});

export default GameFeed;
