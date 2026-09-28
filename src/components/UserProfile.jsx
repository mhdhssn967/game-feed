import React, { useState, useEffect } from 'react';
import { subscribeToFeedGames, auth, storage, db, DEFAULT_AVATAR } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, setDoc, getDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './UserProfile.css';

function UserProfile({ user, isCurrentUser, isDeveloper, onOpenDevDashboard, onBecomeDeveloper, onClose, onPlayGameInFeed }) {
  const [games, setGames] = useState([]);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [avatars, setAvatars] = useState([]);
  const [localUser, setLocalUser] = useState(user);
  const [bio, setBio] = useState("Game dev crafting fun web experiences! 🎮");
  const [isEditingBio, setIsEditingBio] = useState(false);

  const [allGames, setAllGames] = useState([]);
  const [savedGameIds, setSavedGameIds] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToFeedGames((fetchedGames) => {
      if (fetchedGames) {
        setAllGames(fetchedGames);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    const saved = allGames.filter(g => savedGameIds.includes(g.id));
    setGames(saved);
  }, [allGames, savedGameIds]);

  const loadAvatars = () => {
    const bucket = 'gamefaktory-1b0b8.firebasestorage.app';
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/profile_pictures%2F`;
    const files = [
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (1).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (2).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (3).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (4).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (5).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (6).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (7).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (8).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (9).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (10).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (11).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0 (12).webp',
      '1f065674-1cf8-43f6-b2e1-6432e24702d0.webp'
    ];
    const urls = files.map(f => `${baseUrl}${encodeURIComponent(f)}?alt=media`);
    setAvatars(urls);
    setIsSelectingAvatar(true);
  };

  const handleAvatarSelect = async (url) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
        setLocalUser(prev => ({ ...prev, logo: url }));
        setIsSelectingAvatar(false);

        // Also save to Firestore so GameCard can read it
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, { logo: url });
        } else {
          await setDoc(userRef, { followers: [], following: [], logo: url, bio: "Game dev crafting fun web experiences! 🎮" });
        }
      }
    } catch (err) {
      console.error('Failed to update avatar', err);
      alert('Failed to update profile picture.');
    }
  };

  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!user || !user.id) return;
    const userDocRef = doc(db, 'users', user.id);
    
    const unsubscribeStats = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          followers: data.followers ? data.followers.length : 0,
          following: data.following ? data.following.length : 0
        });
        if (data.bio && !isEditingBio) {
          setBio(data.bio);
        }
        if (auth.currentUser && data.followers && data.followers.includes(auth.currentUser.uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
        if (data.savedGames) {
          setSavedGameIds(data.savedGames);
        }
      } else {
        setStats({ followers: 0, following: 0 });
      }
    });
    
    return () => unsubscribeStats();
  }, [user, isEditingBio]);

  const toggleFollow = async () => {
    if (!auth.currentUser) return;
    const currentUserId = auth.currentUser.uid;
    const targetUserId = user.id;

    try {
      const targetUserRef = doc(db, 'users', targetUserId);
      const currentUserRef = doc(db, 'users', currentUserId);

      const targetDoc = await getDoc(targetUserRef);
      if (!targetDoc.exists()) await setDoc(targetUserRef, { followers: [], following: [], bio: "Game dev crafting fun web experiences! 🎮" });
      const currentDoc = await getDoc(currentUserRef);
      if (!currentDoc.exists()) await setDoc(currentUserRef, { followers: [], following: [], bio: "Game dev crafting fun web experiences! 🎮" });

      if (isFollowing) {
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
        await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
      } else {
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
        await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
      }
    } catch (err) {
      console.error("Follow error", err);
    }
  };

  const saveBio = async (newBio) => {
    setIsEditingBio(false);
    if (!isCurrentUser || !auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, { followers: [], following: [], bio: newBio });
      } else {
        await updateDoc(userRef, { bio: newBio });
      }
    } catch (err) {
      console.error("Error saving bio", err);
    }
  };

  const handleGameCardClick = (game) => {
    if (onPlayGameInFeed && game.id) {
      onPlayGameInFeed(game.id);
    } else if (game.link) {
      window.open(game.link, '_blank');
    }
  };

  const handleBecomeDeveloperClick = async () => {
    if (isDeveloper) return;
    const result = await Swal.fire({
      title: null,
      html: `
        <div style="width: 100%; overflow: hidden; border-top-left-radius: 20px; border-top-right-radius: 20px;">
          <img src="/publishgamebanner2.png" style="width: 100%; display: block;" alt="Publish Games" />
        </div>
        <div style="padding: 28px 24px 12px 24px; text-align: center;">
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 28px; margin: 0 0 12px; color: #fff; font-weight: 700; letter-spacing: -0.5px;">Join the Developer Program</h2>
          <p style="font-family: 'Inter', sans-serif; font-size: 16px; margin: 0; color: #d4d4d8; line-height: 1.5;">
            Unlock exclusive developer tools, publish your own HTML5 games directly to the feed, and start building your audience today!
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#27272a',
      confirmButtonText: '<span style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 16px;">Upgrade Now</span>',
      cancelButtonText: '<span style="font-family: \'Inter\', sans-serif; font-weight: 500; font-size: 16px;">Maybe Later</span>',
      background: '#18181b',
      color: '#fff',
      width: '92%',
      padding: '0',
      customClass: {
        popup: 'swal-dev-modal',
        confirmButton: 'swal-dev-btn-confirm',
        cancelButton: 'swal-dev-btn-cancel',
        actions: 'swal-dev-actions'
      }
    });
    if (result.isConfirmed) {
      onBecomeDeveloper();
    }
  };

  return (
    <div className="user-profile-page">
      <div className="up-cover">
        <button className="up-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="up-cover-gradient"></div>
      </div>

      <div className="up-content">
        <div className="up-profile-header">
          <div className="up-avatar-wrapper" onClick={isCurrentUser ? loadAvatars : undefined} style={{ cursor: isCurrentUser ? 'pointer' : 'default' }}>
            <img src={localUser.logo || DEFAULT_AVATAR} alt={localUser.name} className="up-avatar" />
            {isCurrentUser && (
              <div className="up-avatar-edit-overlay">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
            )}
          </div>
          <h2 className="up-username">{localUser.name}</h2>
          <div className="up-bio-container">
            {isEditingBio ? (
              <input 
                type="text" 
                className="up-bio-input"
                value={bio}
                maxLength={50}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => saveBio(bio)}
                onKeyDown={(e) => e.key === 'Enter' && saveBio(bio)}
                autoFocus
              />
            ) : (
              <p className="up-bio-text">
                {bio}
                {isCurrentUser && (
                  <button className="up-bio-edit-btn" onClick={() => setIsEditingBio(true)}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="up-stats-glass">
          <div className="up-stat">
            <span className="up-stat-val">{games.length}</span>
            <span className="up-stat-lbl">Games</span>
          </div>
          <div className="up-stat-divider"></div>
          <div className="up-stat">
            <span className="up-stat-val">{stats.followers}</span>
            <span className="up-stat-lbl">Followers</span>
          </div>
          <div className="up-stat-divider"></div>
          <div className="up-stat">
            <span className="up-stat-val">{stats.following}</span>
            <span className="up-stat-lbl">Following</span>
          </div>
        </div>

        {!isCurrentUser && (
          <div className="up-actions">
            <button className="up-btn-primary" onClick={toggleFollow}>
              {isFollowing ? "Unfollow" : "Follow User"}
            </button>
            <button className="up-btn-secondary">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        )}

        {isCurrentUser && (
          <div className="up-actions" style={{ gap: '10px' }}>
            <button className="up-btn-primary" onClick={() => auth.signOut().then(onClose)}>Sign Out</button>
            {isDeveloper && (
              <button className="up-btn-primary" style={{ background: '#2a224a' }} onClick={onOpenDevDashboard}>
                Developer Dashboard
              </button>
            )}
          </div>
        )}

        {isCurrentUser && !isDeveloper && (
          <div className="developer-banner-wrapper" onClick={handleBecomeDeveloperClick} style={{ cursor: 'pointer', margin: '20px -20px 24px -20px', alignSelf: 'stretch', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <img src="/publishgamebanner2.png" alt="Publish Games" style={{ width: '100%', display: 'block' }} />
          </div>
        )}

        <div className="up-library">
          <div className="up-library-header">
            <h3 className="up-library-title">Saved Games</h3>
          </div>
          <div className="up-cards-grid">
            {games.map(g => (
              <div className="up-game-card" key={g.id} onClick={() => handleGameCardClick(g)}>
                {g.thumbnail ? (
                  <img src={g.thumbnail} alt={g.title} className="up-game-img" loading="lazy" />
                ) : (
                  <div className="up-game-placeholder">
                    <div className="placeholder-particles">
                      <div className="particle p1"></div>
                      <div className="particle p2"></div>
                      <div className="particle p3"></div>
                      <div className="particle p4"></div>
                      <div className="particle p5"></div>
                    </div>
                    <svg className="up-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                      <path d="M6 12h4"></path>
                      <path d="M8 10v4"></path>
                      <line x1="15" y1="13" x2="15.01" y2="13"></line>
                      <line x1="18" y1="11" x2="18.01" y2="11"></line>
                    </svg>
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

      {isSelectingAvatar && (
        <div className="up-avatar-modal">
          <div className="up-avatar-modal-content">
            <button className="up-avatar-close" onClick={() => setIsSelectingAvatar(false)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="up-avatar-modal-title">Choose a Profile Picture</h3>
            <div className="up-avatar-grid">
              {avatars.length === 0 ? (
                <p>Loading...</p>
              ) : (
                avatars.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt="Avatar option" 
                    className="up-avatar-option" 
                    onClick={() => handleAvatarSelect(url)} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
