import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCard from './GameCard';
import { commonGames } from '../data/games';
import { subscribeToFeedGames } from '../firebase';
import './GameFeed.css';

// GameFeed only owns the game slots — no overlapping UI inside
const GameFeed = React.forwardRef(function GameFeed({ onProfileClick }, ref) {
  const [games, setGames] = useState(commonGames);

  // History stack of indices in activeGames array for back-navigation support
  const [history, setHistory] = useState([0]);
  const [historyPointer, setHistoryPointer] = useState(0);

  const [prevGameIndex, setPrevGameIndex] = useState(null);
  const [direction, setDirection] = useState('down');
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  // Subscribe to Firestore /games collection for real-time game updates
  useEffect(() => {
    const unsubscribe = subscribeToFeedGames((fetchedGames) => {
      if (fetchedGames && fetchedGames.length > 0) {
        setGames(fetchedGames);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const activeGames = games.length > 0 ? games : commonGames;

  // Get current game index from history pointer safely
  const currentHistoryVal = history[historyPointer] ?? 0;
  const currentGameIndex = currentHistoryVal < activeGames.length ? currentHistoryVal : 0;

  // Function to pick a random next game index (different from current if possible)
  const getRandomNextIndex = useCallback((currIndex, total) => {
    if (total <= 1) return 0;
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * total);
    } while (nextIdx === currIndex);
    return nextIdx;
  }, []);

  const goDown = useCallback(() => {
    if (animating) return;

    setDirection('down');
    setPrevGameIndex(currentGameIndex);

    if (historyPointer < history.length - 1) {
      // Moving forward in existing history
      setHistoryPointer((p) => p + 1);
    } else {
      // Generate a new random game and push to history
      const nextGameIdx = getRandomNextIndex(currentGameIndex, activeGames.length);
      setHistory((prevHist) => [...prevHist, nextGameIdx]);
      setHistoryPointer((p) => p + 1);
    }

    setAnimating(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPrevGameIndex(null);
      setAnimating(false);
    }, 420);
  }, [animating, currentGameIndex, historyPointer, history.length, activeGames.length, getRandomNextIndex]);

  const goUp = useCallback(() => {
    if (animating || historyPointer <= 0) return;

    setDirection('up');
    setPrevGameIndex(currentGameIndex);
    setHistoryPointer((p) => p - 1);

    setAnimating(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPrevGameIndex(null);
      setAnimating(false);
    }, 420);
  }, [animating, historyPointer, currentGameIndex]);

  // Expose nav controls to parent (App)
  React.useImperativeHandle(ref, () => ({
    goUp,
    goDown,
    disableUp: historyPointer === 0,
    disableDown: false, // Infinite random loop — never stops!
  }), [goUp, goDown, historyPointer]);

  const outClass = direction === 'down' ? 'slide-out-up'    : 'slide-out-down';
  const inClass  = direction === 'down' ? 'slide-in-bottom' : 'slide-in-top';

  return (
    <div className="game-feed">
      {animating && prevGameIndex !== null && activeGames[prevGameIndex] && (
        <div className={`feed-slot ${outClass}`} key={`out-${prevGameIndex}`}>
          <GameCard game={activeGames[prevGameIndex]} shouldLoad={false} onProfileClick={onProfileClick} />
        </div>
      )}
      {activeGames[currentGameIndex] && (
        <div className={`feed-slot ${animating ? inClass : ''}`} key={`in-h${historyPointer}-g${currentGameIndex}`}>
          <GameCard game={activeGames[currentGameIndex]} shouldLoad={true} onProfileClick={onProfileClick} />
        </div>
      )}
    </div>
  );
});

export default GameFeed;
