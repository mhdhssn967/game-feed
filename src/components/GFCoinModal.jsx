import React, { useState, useEffect } from 'react';
import './GFCoinModal.css';
import { X, Clock, UserPlus, Gift, Copy } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function GFCoinModal({ onClose, currentUser }) {
  const [referralCode, setReferralCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    const fetchCode = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().referralCode) {
          setReferralCode(docSnap.data().referralCode);
        }
      } catch (err) {
        console.error('Error fetching referral code:', err);
      }
      setIsLoading(false);
    };
    fetchCode();
  }, [currentUser]);

  const generateCode = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const code = 'GF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const userRef = doc(db, 'users', currentUser.uid);
      const referralRef = doc(db, 'referrals', code);

      await setDoc(userRef, { referralCode: code }, { merge: true });
      await setDoc(referralRef, {
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || 'Anonymous',
        uses: 0,
        createdAt: serverTimestamp()
      });
      setReferralCode(code);
    } catch (err) {
      console.error('Error generating code:', err);
      Swal.fire('Error', 'Could not generate code.', 'error');
    }
    setIsLoading(false);
  };

  const handleCopyReferral = () => {
    if (!referralCode) return;
    const msg = `Join me on GameFaktory and get 75 Bonus Coins! Use my code: ${referralCode}`;
    navigator.clipboard.writeText(msg);
    Swal.fire({
      title: 'Link Copied!',
      text: 'Share this link to earn 50 coins!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'bottom-end',
      background: '#1c1c24',
      color: '#fff'
    });
  };

  return (
    <div className="gfcoin-overlay" onClick={onClose}>
      <div className="gfcoin-modal" onClick={e => e.stopPropagation()}>
        <button className="gfcoin-close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="gfcoin-header">
          <img src="/gfcoin.webp" alt="GF Coin" className="gfcoin-hero-img" />
          <h2>GameFaktory Coins</h2>
          <p>The official currency of the GameFaktory universe.</p>
        </div>

        <div className="gfcoin-ways-to-earn">
          <h3>Ways to Earn</h3>
          
          <div className="earn-card">
            <div className="earn-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Clock size={24} />
            </div>
            <div className="earn-info">
              <h4>Playtime Rewards</h4>
              <p>Earn <strong>1 Coin</strong> for every 5 minutes you spend enjoying games on the app.</p>
            </div>
            <div className="earn-amount">+1</div>
          </div>

          <div className="earn-card">
            <div className="earn-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Gift size={24} />
            </div>
            <div className="earn-info">
              <h4>Onboarding Bonus</h4>
              <p>Get a head start! Earn <strong>50 Coins</strong> just by creating your account.</p>
            </div>
            <div className="earn-amount">+50</div>
          </div>

          <div className="earn-card">
            <div className="earn-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <UserPlus size={24} />
            </div>
            <div className="earn-info">
              <h4>Refer a Friend</h4>
              <p>Earn <strong>50 Coins</strong> for every friend who signs up using your link. They'll also get a bonus <strong>25 Coins</strong>!</p>
            </div>
            <div className="earn-amount">+50</div>
          </div>
        </div>

        <div className="gfcoin-referral-section">
          <h4>Your Referral Code</h4>
          {isLoading ? (
            <div className="referral-box" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#888' }}>Loading...</span>
            </div>
          ) : referralCode ? (
            <div className="referral-box" onClick={handleCopyReferral}>
              <span className="ref-link">{referralCode}</span>
              <button className="ref-copy"><Copy size={16} /></button>
            </div>
          ) : (
            <button className="generate-code-btn" onClick={generateCode}>
              Generate Referral Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
