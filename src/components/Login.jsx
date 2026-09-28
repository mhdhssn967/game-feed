import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Login.css';

function Login({ onLogin, onClose, mandatory }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        if (referralCode) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            pendingReferralCode: referralCode
          }, { merge: true });
        }
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

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      onLogin(); // Navigate to profile/feed
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setErrorMsg('Failed to sign in with Google.');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {!mandatory && (
          <button className="login-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        <div className="login-header">
          <img src="/gflogo.png" alt="GameFaktory" className="login-logo" style={{ filter: 'invert(1)' }} />
          <h2>{isLoginMode ? 'Welcome to GameFaktory' : 'Create Account'}</h2>
          <p>{isLoginMode ? 'Sign in to manage your profile and games.' : 'Join the GameFaktory community!'}</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <button type="button" className="login-google-btn" onClick={handleGoogleSignIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="login-divider">
            <span>or email and password</span>
          </div>
          
          {errorMsg && <div className="login-error">{errorMsg}</div>}
          {!isLoginMode && (
            <>
              <div className="login-input-group">
                <input 
                  type="text" 
                  placeholder="Display Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              <div className="login-input-group">
                <input 
                  type="text" 
                  placeholder="Referral Code (Optional)" 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value)} 
                />
              </div>
            </>
          )}
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
