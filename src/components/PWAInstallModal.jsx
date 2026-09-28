import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

    // Show 100% of the time when criteria are met (no local storage cooldown)
    const showPrompt = async () => {
      // Wait a few seconds before popping up
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (isIOS) {
        Swal.fire({
          title: "Install GameFaktory",
          html: `
            <div style="text-align: center; font-family: 'Inter', sans-serif;">
              <div style="background: #2a224a; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <img src="https://firebasestorage.googleapis.com/v0/b/gamefaktory-1b0b8.firebasestorage.app/o/profile_pictures%2F1f065674-1cf8-43f6-b2e1-6432e24702d0%20(12).webp?alt=media" alt="Icon" style="width: 72px; height: 72px; object-fit: cover; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />
                <h3 style="color: #fff; margin: 0 0 8px; font-family: 'Outfit', sans-serif; font-size: 22px;">Add to Home Screen</h3>
                <p style="color: #a78bfa; font-size: 15px; margin: 0;">Play faster and without distractions!</p>
              </div>
              <div style="color: #e4e4e7; font-size: 15px; text-align: left; background: #27272a; padding: 20px; border-radius: 16px;">
                <p style="margin: 0 0 12px 0;"><strong>1.</strong> Tap the <strong>Share</strong> button <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin: 0 4px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> at the bottom of your screen.</p>
                <p style="margin: 0;"><strong>2.</strong> Scroll down and tap <strong>Add to Home Screen</strong> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin: 0 4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>.</p>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "Got it!",
          confirmButtonColor: "#8b5cf6",
          background: "#1c1c24",
          color: "#fff",
          width: 400,
          customClass: { popup: 'swal-pwa-modal' }
        });
      } else if (deferredPrompt) {
        Swal.fire({
          title: "Install GameFaktory",
          html: `
            <div style="text-align: center; font-family: 'Inter', sans-serif;">
              <div style="background: #2a224a; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <img src="https://firebasestorage.googleapis.com/v0/b/gamefaktory-1b0b8.firebasestorage.app/o/profile_pictures%2F1f065674-1cf8-43f6-b2e1-6432e24702d0%20(12).webp?alt=media" alt="Icon" style="width: 72px; height: 72px; object-fit: cover; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />
                <h3 style="color: #fff; margin: 0 0 8px; font-family: 'Outfit', sans-serif; font-size: 22px;">Play instantly!</h3>
                <p style="color: #a78bfa; font-size: 15px; margin: 0;">Add GameFaktory to your home screen for a full-screen, native-like experience.</p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Install App",
          cancelButtonText: "Not Now",
          confirmButtonColor: "#8b5cf6",
          cancelButtonColor: "#3f3f46",
          background: "#1c1c24",
          color: "#fff",
          width: 400,
          customClass: { popup: 'swal-pwa-modal' }
        }).then((result) => {
          if (result.isConfirmed) {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                  console.log("User accepted the install prompt");
                }
                setDeferredPrompt(null);
              });
            } else {
              Swal.fire({
                title: 'Browser Install',
                text: "To install, click the install icon (⊕) in your browser's address bar.",
                icon: 'info',
                background: '#1c1c24',
                color: '#fff',
                confirmButtonColor: '#8b5cf6'
              });
            }
          }
        });
      }
    };

    // Always show the prompt for testing
    showPrompt();
  }, [isIOS, isStandalone, deferredPrompt]);

  return null;
}
