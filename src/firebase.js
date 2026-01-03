import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGph7LdNoLdMhTpqNlGa7Bq_lXNP2QzBc",
  authDomain: "jumpking-d6cae.firebaseapp.com",
  projectId: "jumpking-d6cae",
  storageBucket: "jumpking-d6cae.firebasestorage.app",
  messagingSenderId: "444242510780",
  appId: "1:444242510780:web:092a2a36520ef12d25a1b9",
  measurementId: "G-BGQCFXK8KC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.warn("Login cancelled by user");
            return null;
        }
        console.error("Login failed:", error.message);
        return null;
    }
}

export async function logout() {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Logout failed:", error);
        return false;
    }
}

export function getCurrentUser() {
    return auth.currentUser;
}

export function onAuthUpdate(callback) {
    onAuthStateChanged(auth, callback);
}

export async function saveHighScore(score) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const userRef = doc(db, "leaderboard", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName,
            photo: user.photoURL,
            score: score,
            date: new Date()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error("Firebase save error:", e);
        return false;
    }
}

export async function getLeaderboard() {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error("Fetch leaderboard error:", e);
        return [];
    }
}

export async function getUserBestScore(uid) {
    try {
        const userRef = doc(db, "leaderboard", uid);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? docSnap.data().score : null;
    } catch (e) {
        console.error("Error fetching user best score:", e);
        return null;
    }
}