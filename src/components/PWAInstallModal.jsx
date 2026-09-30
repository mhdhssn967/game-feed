import React, { useState, useEffect } from "react";
import "./PWAInstallModal.css";

export default function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if app is already installed
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode || isPWA);

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isStandalone) return;

    // Show prompt after a delay
    const timer = setTimeout(() => {
      if (isIOS || deferredPrompt) {
        setShowModal(true);
      } else {
        // Fallback for desktop/android when prompt isn't fired yet but we still want to show it for testing
        setShowModal(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isIOS, isStandalone, deferredPrompt]);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
        setShowModal(false);
      });
    } else {
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="pwa-overlay">
      <div className="pwa-modal">
        {/* Header */}
        <div className="pwa-header">
          <div className="pwa-logo">
            <img src="/gflogo.png" alt="GameFaktory" className="pwa-logo-img" />
          </div>
          <button className="pwa-close-btn" onClick={() => setShowModal(false)}>✕</button>
        </div>

        {/* Title */}
        <h2 className="pwa-title">
          Install<br />
          <span className="pwa-title-highlight">GameFaktory</span>
        </h2>

        {/* Mascot Banner */}
        <div className="pwa-mascot-banner">
          <img src="https://firebasestorage.googleapis.com/v0/b/gamefaktory-1b0b8.firebasestorage.app/o/profile_pictures%2F1f065674-1cf8-43f6-b2e1-6432e24702d0%20(12).webp?alt=media" alt="Mascot" className="pwa-mascot-img" />
          <div className="pwa-mascot-text">
            <h3>Add to<br/>Home Screen</h3>
            <p>Play faster and without distractions!</p>
          </div>
        </div>

        {/* Steps */}
        <div className="pwa-steps-container">
          <div className="pwa-step">
            <div className="pwa-step-number">1</div>
            <div className="pwa-step-icon pwa-step-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="pwa-step-text">
              Tap the <span className="pwa-highlight-blue">Share</span> button<br/>
              at the bottom of your screen.
            </div>
          </div>
          
          <div className="pwa-step-divider"></div>

          <div className="pwa-step">
            <div className="pwa-step-number">2</div>
            <div className="pwa-step-icon pwa-step-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div className="pwa-step-text">
              Scroll down and tap<br/>
              <span className="pwa-highlight-purple">Add to Home Screen</span> <span className="pwa-plus-icon">+</span>.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="pwa-action-btn" onClick={handleInstall}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{marginRight: '6px'}}>
            <path d="M12 3l10 9h-3v9h-14v-9h-3l10-9z" />
          </svg>
          Got it!
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{marginLeft: '4px'}}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
