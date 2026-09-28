import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCard from './GameCard';
import { commonGames } from '../data/games';
import { subscribeToFeedGames } from '../firebase';
import './GameFeed.css';

// GameFeed only owns the game slots — no overlapping UI inside
const GameFeed = React.forwardRef(function GameFeed({ onProfileClick, initialGameId }, ref) {
  const [games, setGames] = useState(commonGames);

  // History stack of indices in activeGames array for back-navigation support
  const [history, setHistory] = useState([0]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const [initialGameSet, setInitialGameSet] = useState(false);

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

  useEffect(() => {
    if (initialGameId && activeGames.length > 0 && activeGames !== commonGames && !initialGameSet) {
      const idx = activeGames.findIndex(g => g.id === initialGameId);
      if (idx !== -1) {
        setHistory([idx]);
        setHistoryPointer(0);
        setInitialGameSet(true);
      }
    }
  }, [initialGameId, activeGames, initialGameSet]);

  // Get current game index from history pointer safely
  const currentHistoryVal = history[historyPointer] ?? 0;
  const currentGameIndex = currentHistoryVal < activeGames.length ? currentHistoryVal : 0;

  const deckRef = useRef([]);

  // Function to pick a random next game using a 'shuffled deck' system to prevent repetition
  const getRandomNextIndex = useCallback((currIndex, total) => {
    if (total <= 1) return 0;
    
    // Refill the deck if it's empty, or if the total number of games changed
    if (deckRef.current.length === 0 || Math.max(...deckRef.current) >= total) {
      let newDeck = Array.from({ length: total }, (_, i) => i);
      // Remove the currently playing game from the new deck so we don't play it twice in a row
      newDeck = newDeck.filter(i => i !== currIndex);
      
      // Shuffle the deck (Fisher-Yates)
      for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
      }
      deckRef.current = newDeck;
    }

    return deckRef.current.pop();
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

  const playSpecificGame = useCallback((gameId) => {
    const idx = activeGames.findIndex(g => g.id === gameId);
    if (idx !== -1 && idx !== currentGameIndex) {
      setDirection('down');
      setPrevGameIndex(currentGameIndex);
      
      setHistory((prev) => {
         const newHist = [...prev.slice(0, historyPointer + 1), idx];
         setHistoryPointer(newHist.length - 1);
         return newHist;
      });
      
      setAnimating(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPrevGameIndex(null);
        setAnimating(false);
      }, 420);
    }
  }, [activeGames, currentGameIndex, historyPointer]);

  // Expose nav controls to parent (App)
  React.useImperativeHandle(ref, () => ({
    goUp,
    goDown,
    playSpecificGame,
    disableUp: historyPointer === 0,
    disableDown: false,
  }), [goUp, goDown, playSpecificGame, historyPointer]);

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
