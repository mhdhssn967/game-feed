import React, { useState, useEffect } from 'react';
import './GFCoinModal.css';
import { X, Clock, UserPlus, Gift, Copy, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function GFCoinModal({ onClose, currentUser, userData, playtimeSeconds = 0 }) {
  const [referralCode, setReferralCode] = useState(null);
  const [referralUses, setReferralUses] = useState(0);
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
          const code = docSnap.data().referralCode;
          setReferralCode(code);
          try {
            const refDoc = await getDoc(doc(db, 'referrals', code));
            if (refDoc.exists()) {
              setReferralUses(refDoc.data().uses || 0);
            }
          } catch (e) {
            console.error('Failed to fetch referral uses', e);
          }
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

  const onboardingClaimed = userData?.onboardingClaimed || false;
  
  // Strictly rely on backend tracking for playtime coins to avoid miscalculating referral bonuses
  const playtimeCoins = userData?.playtimeCoins || 0;

  const showClaimedView = onboardingClaimed || playtimeCoins >= 1;
  const timeSpentMins = playtimeCoins * 5;

  return (
    <div className="gfcoin-overlay" onClick={onClose}>
      <div className="gfcoin-modal" onClick={e => e.stopPropagation()}>
        <button className="gfcoin-close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="gfcoin-header">
          <img src="/gfcoin.webp" alt="GF Coin" className="gfcoin-hero-img" />
          <h2>GameFaktory Coins</h2>
          <p>The official currency of the GameFaktory universe.</p>
        </div>

        {showClaimedView ? (
          <div className="gfcoin-ways-to-earn">
            <h3>Your Rewards</h3>
            
            <div className="earn-card" style={{ opacity: 0.8 }}>
              <div className="earn-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </div>
              <div className="earn-info">
                <h4 style={{ textDecoration: 'line-through' }}>Onboarding Bonus</h4>
                <p>You have successfully claimed your 50 Coins onboarding gift!</p>
              </div>
              <div className="earn-amount" style={{ color: '#10b981' }}>✓</div>
            </div>

            <div className="earn-card" style={{ position: 'relative' }}>
              <div className="earn-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Clock size={24} />
              </div>
              <div className="earn-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0 }}>Playtime Rewards</h4>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.05)', color: '#e4e4e7'
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      {Math.floor(playtimeSeconds / 60)}:{(playtimeSeconds % 60).toString().padStart(2, '0')} / 5:00
                    </span>
                  </div>
                </div>
                <p style={{ margin: '4px 0' }}>Time Spent: <strong>{timeSpentMins} Minutes</strong></p>
                <p style={{ margin: 0 }}>Coins Collected: <strong>{playtimeCoins} Coins</strong></p>
              </div>
            </div>
          </div>
        ) : (
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

          </div>
        )}

        {/* Referral Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '24px 20px' }}></div>

        <div className="gfcoin-ways-to-earn" style={{ marginTop: 0 }}>
          <h3>Refer a Friend</h3>
          <div className="earn-card">
            <div className="earn-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <UserPlus size={24} />
            </div>
            <div className="earn-info">
              <h4>Referral Program</h4>
              <p>Earn <strong>50 Coins</strong> for every friend who signs up using your link.</p>
              {referralUses > 0 && (
                <p style={{ marginTop: '6px', color: '#10b981', fontWeight: '500' }}>
                  Friends Referred: <strong>{referralUses}</strong> (Earned: {referralUses * 50} Coins)
                </p>
              )}
            </div>
            <div className="earn-amount">+50</div>
          </div>
        </div>

        <div className="gfcoin-referral-section" style={{ marginTop: '10px' }}>
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
