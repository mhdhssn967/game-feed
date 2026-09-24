import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsnmKrEL8RY7iEQlkLo1Ef1Xqw7bB4QBQ",
  authDomain: "gamefaktory-1b0b8.firebaseapp.com",
  projectId: "gamefaktory-1b0b8",
  storageBucket: "gamefaktory-1b0b8.firebasestorage.app",
  messagingSenderId: "95784943954",
  appId: "1:95784943954:web:907fb25872cada6edcba8b",
  measurementId: "G-WG9Q3T8XQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Analytics (safely initialized)
export let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

/**
 * Subscribe to feed games from Firestore '/games' collection.
 * Calls callback with array of game objects [{ id, url, title, ... }].
 */
export function subscribeToFeedGames(onGamesLoaded) {
  try {
    const gamesRef = collection(db, "games");
    return onSnapshot(gamesRef, (snapshot) => {
      const games = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.link) {
          games.push({
            id: doc.id,
            url: data.link,
            title: data.title || "Untitled Game",
            addedByName: data.addedByName || "",
            thumbnail: data.thumbnail || null,
            createdAt: data.createdAt ? data.createdAt : null,
          });
        }
      });

      if (games.length > 0) {
        onGamesLoaded(games);
      }
    }, (error) => {
      console.warn("Firestore subscription error, using fallback games:", error);
    });
  } catch (error) {
    console.warn("Failed to initialize Firestore listener:", error);
    return () => {};
  }
}
