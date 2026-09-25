import React, { useState, useEffect } from 'react';
import { subscribeToFeedGames, auth, storage, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { doc, updateDoc, onSnapshot, setDoc, getDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import './UserProfile.css';

function UserProfile({ user, isCurrentUser, onClose }) {
  const [games, setGames] = useState([]);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [avatars, setAvatars] = useState([]);
  const [localUser, setLocalUser] = useState(user);
  const [bio, setBio] = useState("Game dev crafting fun web experiences! 🎮");
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToFeedGames((fetchedGames) => {
      if (fetchedGames) {
        const userGames = fetchedGames.filter(g => g.addedByUserId === user.id || g.addedByName === user.name);
        setGames(userGames);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

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

  const [editingGame, setEditingGame] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState(null);

  const handleGameCardClick = (game) => {
    if (isCurrentUser) {
      setEditingGame(game);
      setEditTitle(game.title);
      setEditThumbnailPreview(game.thumbnail);
      setEditThumbnailFile(null);
    }
  };

  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameUrl, setNewGameUrl] = useState('');
  const [newGameThumbnailFile, setNewGameThumbnailFile] = useState(null);
  const [newGameThumbnailPreview, setNewGameThumbnailPreview] = useState(null);

  const processImageForWebp = (file, setFile, setPreview) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        setFile(blob);
        setPreview(URL.createObjectURL(blob));
      }, 'image/webp', 0.8);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) processImageForWebp(file, setEditThumbnailFile, setEditThumbnailPreview);
  };

  const handleNewThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) processImageForWebp(file, setNewGameThumbnailFile, setNewGameThumbnailPreview);
  };

  const saveGameEdit = async () => {
    if (!editingGame) return;
    try {
      let finalThumbnailUrl = editingGame.thumbnail;
      if (editThumbnailFile) {
        const thumbRef = ref(storage, `game_thumbnails/${editingGame.id}_${Date.now()}.webp`);
        await uploadBytes(thumbRef, editThumbnailFile);
        finalThumbnailUrl = await getDownloadURL(thumbRef);
      }
      const gameDocRef = doc(db, 'games', editingGame.id);
      await updateDoc(gameDocRef, {
        title: editTitle,
        thumbnail: finalThumbnailUrl
      });
      setEditingGame(null);
    } catch (err) {
      console.error('Error saving game:', err);
      alert('Failed to save game changes.');
    }
  };

  const saveNewGame = async () => {
    if (!newGameTitle || !newGameUrl) {
      alert("Please provide both a title and a URL for the game.");
      return;
    }
    try {
      let finalThumbnailUrl = null;
      if (newGameThumbnailFile) {
        const thumbRef = ref(storage, `game_thumbnails/new_${Date.now()}.webp`);
        await uploadBytes(thumbRef, newGameThumbnailFile);
        finalThumbnailUrl = await getDownloadURL(thumbRef);
      }
      const gamesRef = collection(db, 'games');
      await addDoc(gamesRef, {
        title: newGameTitle,
        link: newGameUrl,
        thumbnail: finalThumbnailUrl,
        addedByUserId: auth.currentUser.uid,
        addedByName: auth.currentUser.displayName || 'Anonymous Player',
        createdAt: serverTimestamp()
      });
      setIsAddingGame(false);
      setNewGameTitle('');
      setNewGameUrl('');
      setNewGameThumbnailFile(null);
      setNewGameThumbnailPreview(null);
    } catch (err) {
      console.error('Error adding game:', err);
      alert('Failed to add new game.');
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
            {localUser.logo ? (
              <img src={localUser.logo} alt={localUser.name} className="up-avatar" />
            ) : (
              <div className="up-avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
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
          <div className="up-actions">
            <button className="up-btn-primary" onClick={() => auth.signOut().then(onClose)}>Sign Out</button>
          </div>
        )}

        <div className="up-library">
          <div className="up-library-header">
            <h3 className="up-library-title">Library</h3>
            {isCurrentUser && (
              <button className="up-add-game-btn" onClick={() => setIsAddingGame(true)}>
                + Add
              </button>
            )}
          </div>
          <div className="up-cards-grid">
            {games.map(g => (
              <div className="up-game-card" key={g.id} onClick={() => handleGameCardClick(g)}>
                {g.thumbnail ? (
                  <img src={g.thumbnail} alt={g.title} className="up-game-img" />
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

      {isAddingGame && (
        <div className="up-avatar-modal">
          <div className="up-avatar-modal-content">
            <button className="up-avatar-close" onClick={() => setIsAddingGame(false)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="up-avatar-modal-title">Add New Game</h3>
            <div className="edit-game-form">
              <label>Game Title</label>
              <input type="text" value={newGameTitle} onChange={(e) => setNewGameTitle(e.target.value)} className="edit-game-input" placeholder="Enter game title" />
              
              <label>Game URL (Required)</label>
              <input type="text" value={newGameUrl} onChange={(e) => setNewGameUrl(e.target.value)} className="edit-game-input" placeholder="https://example.com/game" />
              
              <label>Thumbnail (Optional)</label>
              <div className="edit-game-img-preview" onClick={() => document.getElementById('newThumbnailInput').click()}>
                {newGameThumbnailPreview ? (
                  <img src={newGameThumbnailPreview} alt="Thumbnail preview" />
                ) : (
                  <span>Click to upload image</span>
                )}
              </div>
              <input type="file" id="newThumbnailInput" style={{ display: 'none' }} accept="image/*" onChange={handleNewThumbnailChange} />
              
              <button className="up-btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={saveNewGame}>Add Game</button>
            </div>
          </div>
        </div>
      )}

      {editingGame && (
        <div className="up-avatar-modal">
          <div className="up-avatar-modal-content">
            <button className="up-avatar-close" onClick={() => setEditingGame(null)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="up-avatar-modal-title">Edit Game</h3>
            <div className="edit-game-form">
              <label>Game Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="edit-game-input" />
              
              <label>Thumbnail</label>
              <div className="edit-game-img-preview" onClick={() => document.getElementById('thumbnailInput').click()}>
                {editThumbnailPreview ? (
                  <img src={editThumbnailPreview} alt="Thumbnail preview" />
                ) : (
                  <span>Click to upload image</span>
                )}
              </div>
              <input type="file" id="thumbnailInput" style={{ display: 'none' }} accept="image/*" onChange={handleThumbnailChange} />
              
              <button className="up-btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={saveGameEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

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
