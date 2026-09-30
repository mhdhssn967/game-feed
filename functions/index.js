const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.toggleLike = onCall(async (request) => {
  const { auth, data } = request;
  let uid;
  if (auth) {
    uid = auth.uid;
  } else if (data && data.token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(data.token);
      uid = decodedToken.uid;
    } catch (e) {
      throw new HttpsError("unauthenticated", "Invalid token provided.");
    }
  } else {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in to like a game."
    );
  }

  const { gameId } = data;
  if (!gameId) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a gameId."
    );
  }

  const userId = uid;
  const gameRef = db.collection("games").doc(gameId);
  const likeRef = gameRef.collection("likes").doc(userId);

  try {
    return await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new HttpsError("not-found", "Game not found.");
      }

      let newLikesCount = Number(gameDoc.data().likesCount);
      if (isNaN(newLikesCount)) {
        newLikesCount = 0;
      }
      let liked = false;

      if (likeDoc.exists) {
        // User already liked, so unlike
        transaction.delete(likeRef);
        newLikesCount = Math.max(0, newLikesCount - 1);
        transaction.update(gameRef, { likesCount: newLikesCount });
        liked = false;
      } else {
        // User has not liked, so like
        transaction.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
        newLikesCount += 1;
        transaction.update(gameRef, { likesCount: newLikesCount });
        liked = true;
      }

      return { success: true, liked, likesCount: newLikesCount };
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message);
  }
});

exports.addComment = onCall(async (request) => {
  const { auth, data } = request;
  let uid;
  if (auth) {
    uid = auth.uid;
  } else if (data && data.token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(data.token);
      uid = decodedToken.uid;
    } catch (e) {
      throw new HttpsError("unauthenticated", "Invalid token provided.");
    }
  } else {
    throw new HttpsError("unauthenticated", "User must be logged in to comment.");
  }

  const { gameId, text } = data;
  if (!gameId || !text || text.trim() === "") {
    throw new HttpsError("invalid-argument", "Game ID and non-empty text are required.");
  }

  try {
    let userName = "Unknown User";
    let userLogo = "";
    
    // First try to get from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      userName = userDoc.data().name || userName;
      userLogo = userDoc.data().logo || userLogo;
    }

    // Fallback to Firebase Auth profile if not found in Firestore
    if (userName === "Unknown User") {
      try {
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.displayName) userName = userRecord.displayName;
        if (userRecord.photoURL && !userLogo) userLogo = userRecord.photoURL;
      } catch (e) {
        console.warn("Could not fetch user record from Auth:", e);
      }
    }

    const gameRef = db.collection("games").doc(gameId);
    const commentRef = gameRef.collection("comments").doc();

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists) {
        throw new HttpsError("not-found", "Game not found.");
      }

      let newCommentsCount = Number(gameDoc.data().commentsCount);
      if (isNaN(newCommentsCount)) newCommentsCount = 0;
      newCommentsCount += 1;

      transaction.set(commentRef, {
        userId: uid,
        userName,
        userLogo,
        text: text.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(gameRef, { commentsCount: newCommentsCount });
    });

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

exports.generateReferralCode = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      let existingCode = userDoc.exists ? userDoc.data().referralCode : null;
      
      if (existingCode) {
        return { code: existingCode };
      }

      let isUnique = false;
      let code = "";
      while (!isUnique) {
        code = "GF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const refDoc = await t.get(db.collection("referrals").doc(code));
        if (!refDoc.exists) {
          isUnique = true;
        }
      }

      t.set(userRef, { referralCode: code }, { merge: true });
      t.set(db.collection("referrals").doc(code), {
        ownerId: uid,
        ownerName: auth.token.name || "Anonymous",
        uses: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { code };
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    throw new HttpsError("internal", error.message);
  }
});

exports.processReferralCode = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in.");
  
  const referralCode = data?.referralCode ? data.referralCode.trim().toUpperCase() : null;
  const uid = auth.uid;
  
  try {
    return await db.runTransaction(async (t) => {
      const newUserDataRef = db.collection("users").doc(uid);
      const newUserDoc = await t.get(newUserDataRef);
      
      if (newUserDoc.exists && newUserDoc.data().onboardingClaimed) {
        return { success: false, reason: 'Already claimed' };
      }

      let activeReferralCode = referralCode;
      if (!activeReferralCode && newUserDoc.exists && newUserDoc.data().pendingReferralCode) {
        activeReferralCode = newUserDoc.data().pendingReferralCode.trim().toUpperCase();
      }

      let coinsToAdd = 50; // Base onboarding bonus
      let validReferral = false;

      if (activeReferralCode) {
        const refDocRef = db.collection("referrals").doc(activeReferralCode);
        const refDoc = await t.get(refDocRef);
        
        if (refDoc.exists && refDoc.data().ownerId !== uid) {
          validReferral = true;
          coinsToAdd += 25; // Extra bonus for using referral
          
          const ownerId = refDoc.data().ownerId;
          const ownerRef = db.collection("users").doc(ownerId);
          
          // Give owner 50 coins
          const ownerDoc = await t.get(ownerRef);
          const ownerCoins = (ownerDoc.exists && ownerDoc.data().coins) ? Number(ownerDoc.data().coins) : 0;
          t.set(ownerRef, { coins: ownerCoins + 50 }, { merge: true });
          
          // Increment uses
          t.update(refDocRef, { uses: admin.firestore.FieldValue.increment(1) });
        }
      }
      
      const currentUserCoins = (newUserDoc.exists && newUserDoc.data().coins) ? Number(newUserDoc.data().coins) : 0;
      
      t.set(newUserDataRef, { 
        coins: currentUserCoins + coinsToAdd,
        onboardingClaimed: true,
        usedReferralCode: validReferral ? activeReferralCode : null,
        pendingReferralCode: admin.firestore.FieldValue.delete()
      }, { merge: true });

      return { success: true, coinsAdded: coinsToAdd, validReferral };
    });
  } catch (error) {
    console.error("Error processing referral:", error);
    throw new HttpsError("internal", error.message);
  }
});

exports.awardPlaytimeCoin = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const currentCoins = (userDoc.exists && userDoc.data().coins) ? Number(userDoc.data().coins) : 0;
      const currentPlaytimeCoins = (userDoc.exists && userDoc.data().playtimeCoins) ? Number(userDoc.data().playtimeCoins) : 0;
      t.set(userRef, { 
        coins: currentCoins + 1,
        playtimeCoins: currentPlaytimeCoins + 1
      }, { merge: true });
      return { success: true, coinsAdded: 1 };
    });
  } catch (error) {
    console.error("Error awarding playtime coin:", error);
    throw new HttpsError("internal", error.message);
  }
});

exports.purchaseLife = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const currentCoins = (userDoc.exists && userDoc.data().coins) ? Number(userDoc.data().coins) : 0;
      
      if (currentCoins < 10) {
        throw new HttpsError("failed-precondition", "Not enough coins. Need 10 coins.");
      }

      const currentLives = (userDoc.exists && userDoc.data().lives) ? Number(userDoc.data().lives) : 0;
      
      t.set(userRef, { 
        coins: currentCoins - 10,
        lives: currentLives + 1
      }, { merge: true });
      return { success: true, livesAdded: 1 };
    });
  } catch (error) {
    console.error("Error purchasing life:", error);
    throw new HttpsError(error.code || "internal", error.message);
  }
});

exports.consumeLife = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const currentLives = (userDoc.exists && userDoc.data().lives) ? Number(userDoc.data().lives) : 0;
      
      if (currentLives <= 0) {
        throw new HttpsError("failed-precondition", "No lives available.");
      }

      t.set(userRef, { 
        lives: currentLives - 1
      }, { merge: true });
      return { success: true, livesRemaining: currentLives - 1 };
    });
  } catch (error) {
    console.error("Error consuming life:", error);
    throw new HttpsError(error.code || "internal", error.message);
  }
});
