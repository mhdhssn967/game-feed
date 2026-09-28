import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2 } from 'lucide-react';
import { db, auth, functions } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Swal from 'sweetalert2';
import './CommentsOverlay.css';

function CommentsOverlay({ gameId, isOpen, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!gameId || !isOpen) return;

    const commentsRef = collection(db, 'games', gameId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = [];
      snapshot.forEach(doc => {
        fetchedComments.push({ id: doc.id, ...doc.data() });
      });
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [gameId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to comment.',
        icon: 'info',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    let token = null;
    try {
      token = await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.warn("Could not refresh token:", e);
    }

    try {
      const addComment = httpsCallable(functions, 'addComment');
      await addComment({ gameId, text: newComment, token });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to add comment.',
        icon: 'error',
        background: '#1c1c24',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!auth.currentUser) return;
    const result = await Swal.fire({
      title: 'Delete Comment?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      background: '#1c1c24',
      color: '#fff'
    });
    
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'games', gameId, 'comments', commentId));
      } catch (err) {
        console.error("Error deleting comment:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete comment.',
          icon: 'error',
          background: '#1c1c24',
          color: '#fff',
          confirmButtonColor: '#8b5cf6'
        });
      }
    }
  };

  if (!document.body) return null;

  return createPortal(
    <div className={`comments-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="comments-header">
        <h3>Comments</h3>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
      </div>
      
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">No comments yet. Be the first!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <img 
                src={comment.userLogo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(comment.userName || "?") + "&background=333&color=fff"} 
                alt={comment.userName} 
                className="comment-avatar" 
              />
              <div className="comment-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="comment-user">{comment.userName || 'Anonymous'}</h4>
                  {auth.currentUser && auth.currentUser.uid === comment.userId && (
                    <button 
                      className="comment-delete-btn" 
                      onClick={() => handleDelete(comment.id)}
                      style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', padding: '4px' }}
                      title="Delete Comment"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="comment-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="comment-input" 
          placeholder="Add a comment..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim() || isSubmitting}>
          <Send size={18} />
        </button>
      </form>
    </div>,
    document.body
  );
}

export default CommentsOverlay;
