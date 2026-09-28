import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { db, auth, functions, DEFAULT_AVATAR } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Swal from 'sweetalert2';
import CommentsOverlay from './CommentsOverlay';
import './GameCard.css';

function GameCard({ game, url: fallbackUrl, shouldLoad, onProfileClick }) {
  const url = game?.link || game?.url || fallbackUrl;
  const developerName = game?.addedByName || game?.developer || 'Unknown User';
  const comments = game?.commentsCount || 0;

  const [developerLogo, setDeveloperLogo] = useState(null);
  const [localLikesCount, setLocalLikesCount] = useState(game?.likesCount || 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(game?.commentsCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalLikesCount(game?.likesCount || 0);
    setLocalCommentsCount(game?.commentsCount || 0);
  }, [game?.likesCount, game?.commentsCount]);

  useEffect(() => {
    let isMounted = true;
    if (auth.currentUser && game?.id) {
       getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
         if (isMounted && snap.exists()) {
           const data = snap.data();
           if (data.savedGames && data.savedGames.includes(game.id)) {
             setIsSaved(true);
           }
         }
       });
       getDoc(doc(db, 'games', game.id, 'likes', auth.currentUser.uid)).then(snap => {
         if (isMounted) setIsLiked(snap.exists());
       });
    }
    return () => { isMounted = false; };
  }, [game?.id, auth.currentUser]);

  const handleLike = async () => {
    if (!auth.currentUser) {
      alert("Please login to like games.");
      return;
    }
    if (isLiking) return;

    let token = null;
    try {
      token = await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.warn("Could not refresh token:", e);
    }

    setIsLiking(true);
    // Optimistic update
    const previousIsLiked = isLiked;
    const previousLikesCount = localLikesCount;
    setIsLiked(!isLiked);
    setLocalLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const toggleLike = httpsCallable(functions, 'toggleLike');
      const result = await toggleLike({ gameId: game.id, token });
      setIsLiked(result.data.liked);
      setLocalLikesCount(result.data.likesCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked(previousIsLiked);
      setLocalLikesCount(previousLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to save games.',
        icon: 'info',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    const prevSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      if (prevSaved) {
        await updateDoc(userRef, { savedGames: arrayRemove(game.id) });
      } else {
        await updateDoc(userRef, { savedGames: arrayUnion(game.id) });
      }
    } catch (e) {
      setIsSaved(prevSaved);
      console.error(e);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save game.',
        icon: 'error',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } finally {
      setIsSaving(false);
    }
  };


  useEffect(() => {
    let isMounted = true;

    // Fast fallback: if this game belongs to the currently logged in user, use their auth picture!
    if (auth.currentUser && game?.addedByUserId === auth.currentUser.uid && auth.currentUser.photoURL) {
      setDeveloperLogo(auth.currentUser.photoURL);
    }

    if (game?.addedByUserId) {
      getDoc(doc(db, 'users', game.addedByUserId)).then(snap => {
        if (isMounted && snap.exists() && snap.data().logo) {
          setDeveloperLogo(snap.data().logo);
        }
      });
    }

    return () => { isMounted = false; };
  }, [game]);



  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?game=${game.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Play ${game.title} on GameFaktory!`,
          text: `Check out this awesome game I found: ${game.title}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        Swal.fire({
          title: 'Link Copied!',
          text: 'The game link has been copied to your clipboard.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#1c1c24',
          color: '#fff',
          toast: true,
          position: 'bottom-end'
        });
      }
    } catch (e) {
      console.log('Share failed or was cancelled', e);
    }
  };

  const handleDevClick = (e) => {
    e.stopPropagation();
    if (onProfileClick) {
      onProfileClick({
        id: game?.addedByUserId || game?.id || 'unknown',
        name: developerName,
        logo: developerLogo
      }, true);
    }
  };

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

      {/* ── Top Bar (User Info) ── */}
      <div className="game-top-bar visible">
        <div className="dev-info-compact" onClick={handleDevClick} style={{ cursor: 'pointer' }}>
          <div className="dev-profile-pic-small" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a224a', color: '#a78bfa' }}>
            <img src={developerLogo || DEFAULT_AVATAR} alt={developerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className="dev-name-small">{developerName}</span>
        </div>
        <button className="follow-btn-small">Follow</button>
      </div>

      {/* ── Overlay UI (Engagement Actions) ── */}
      <div className="game-overlay visible">
        <div className="action-buttons-col">
          <button className="action-btn" onClick={handleLike}>
            <Heart className="action-icon" size={28} color={isLiked ? "#ff4040" : "#fff"} fill={isLiked ? "#ff4040" : "none"} />
            <span className="action-text">{localLikesCount}</span>
          </button>
          <button className="action-btn" onClick={() => setShowComments(true)}>
            <MessageCircle className="action-icon" size={28} color="#fff" />
            <span className="action-text">{localCommentsCount}</span>
          </button>
          <button className="action-btn" onClick={handleSave}>
            <Bookmark className="action-icon" size={28} color={isSaved ? "#facc15" : "#fff"} fill={isSaved ? "#facc15" : "none"} />
            <span className="action-text">Save</span>
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Share2 className="action-icon" size={28} color="#fff" />
            <span className="action-text">Share</span>
          </button>
        </div>
      </div>

      <CommentsOverlay 
        gameId={game?.id} 
        isOpen={showComments} 
        onClose={() => setShowComments(false)} 
      />
    </div>
  );
}

export default GameCard;
