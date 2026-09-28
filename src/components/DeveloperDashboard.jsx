import React, { useState, useEffect } from 'react';
import { subscribeToFeedGames, auth, storage, db } from '../firebase';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { doc, updateDoc, collection, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './DeveloperDashboard.css';

function DeveloperDashboard({ user, isCurrentUser, onClose, onPlayGameInFeed }) {
  const [games, setGames] = useState([]);
  const [localUser] = useState(user);

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
    } else if (onPlayGameInFeed) {
      onPlayGameInFeed(game.id);
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
      Swal.fire({
        title: 'Success!',
        text: 'Game changes saved.',
        icon: 'success',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } catch (err) {
      console.error('Error saving game:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save game changes.',
        icon: 'error',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    }
  };

  const deleteGame = async () => {
    if (!editingGame) return;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this game? This cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      background: '#1c1c24',
      color: '#fff'
    });
    
    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'games', editingGame.id));
      setEditingGame(null);
      Swal.fire({
        title: 'Deleted!',
        text: 'Your game has been deleted.',
        icon: 'success',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } catch (err) {
      console.error('Error deleting game:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete game.',
        icon: 'error',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    }
  };

  const playTestGame = () => {
    if (editingGame && editingGame.id && onPlayGameInFeed) {
      onPlayGameInFeed(editingGame.id);
    }
  };

  const saveNewGame = async () => {
    if (!newGameTitle || !newGameUrl) {
      Swal.fire({
        title: 'Missing Info',
        text: 'Please provide both a title and a URL for the game.',
        icon: 'warning',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
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
      Swal.fire({
        title: 'Game Added!',
        text: 'Your new game is now live!',
        icon: 'success',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } catch (err) {
      console.error('Error adding game:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to add new game.',
        icon: 'error',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
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
          <h2 className="up-username">{localUser.name}</h2>
          <span style={{color: '#a78bfa'}}>Developer Mode</span>
        </div>

        <div className="up-library">
          <div className="up-library-header">
            <h3 className="up-library-title">My Games</h3>
            <button className="up-add-game-btn" onClick={() => setIsAddingGame(true)}>
              + Add New Game
            </button>
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
              
              <div style={{ display: 'flex', gap: '10px', marginTop: 10 }}>
                <button className="up-btn-primary" style={{ flex: 1, background: '#4CAF50' }} onClick={playTestGame}>
                  Play / Test
                </button>
                <button className="up-btn-primary" style={{ flex: 1, background: '#f44336' }} onClick={deleteGame}>
                  Delete Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeveloperDashboard;
