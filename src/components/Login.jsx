import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

function Login({ onLogin, onClose }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin(); // Navigate to profile
    } catch (err) {
      console.error('Login error:', err);
      let friendlyMsg = 'Failed to authenticate.';
      if (err.code === 'auth/invalid-credential') friendlyMsg = 'Invalid email or password.';
      if (err.code === 'auth/email-already-in-use') friendlyMsg = 'Email is already registered.';
      if (err.code === 'auth/weak-password') friendlyMsg = 'Password should be at least 6 characters.';
      setErrorMsg(friendlyMsg);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <button className="login-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="login-header">
          <img src="/gflogo.png" alt="GameFaktory" className="login-logo" style={{ filter: 'invert(1)' }} />
          <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLoginMode ? 'Sign in to manage your profile and games.' : 'Join the GameFaktory community!'}</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {errorMsg && <div className="login-error">{errorMsg}</div>}
          <div className="login-input-group">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="login-input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="login-submit-btn">
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <span className="login-toggle" onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg('');
            }}>
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
