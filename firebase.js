// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    increment, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDDUVE-5BIjKgh-PcOcnvGKntCaoA0R37A",
  authDomain: "tapmap-a7e1d.firebaseapp.com",
  projectId: "tapmap-a7e1d",
  storageBucket: "tapmap-a7e1d.firebasestorage.app",
  messagingSenderId: "1073914424721",
  appId: "1:1073914424721:web:dd9fa3f530cd9c74be3e30",
  measurementId: "G-EWQGY2LEFC"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

/* =========================
   AUTH FUNCTIONS
========================= */

export const registerUser = async (email, password) => {
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create default business doc
        await setDoc(doc(db, "businesses", userCred.user.uid), {
            name: "",
            tagline: "",
            desc: "",
            address: "",
            phone: "",
            email: "",
            portfolio: [],
            location: { lat: 0, lng: 0 }
        });
        return userCred.user;
    } catch (err) {
        if(err.code === "auth/email-already-in-use") throw new Error("This email is already registered.");
        if(err.code === "auth/invalid-email") throw new Error("Invalid email address.");
        if(err.code === "auth/weak-password") throw new Error("Password should be at least 6 characters.");
        throw err;
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        return userCred.user;
    } catch(err) {
        if(err.code === "auth/user-not-found") throw new Error("No account found with this email.");
        if(err.code === "auth/wrong-password") throw new Error("Incorrect password.");
        if(err.code === "auth/invalid-email") throw new Error("Invalid email address.");
        throw err;
    }
};

export const logoutUser = () => signOut(auth);

export const listenAuth = callback => onAuthStateChanged(auth, callback);

/* =========================
   BUSINESS FUNCTIONS
========================= */

export const saveBusiness = async (uid, data) => {
    await setDoc(doc(db, "businesses", uid), data);
};

export const loadBusiness = async (uid) => {
    const snap = await getDoc(doc(db, "businesses", uid));
    return snap.exists() ? snap.data() : null;
};

/* =========================
   ANALYTICS
========================= */

export const logActivity = async (uid, type) => {
    const ref = doc(db, "analytics", uid);
    await updateDoc(ref, { [type]: increment(1) }).catch(() => 
        setDoc(ref, { views:0, scans:0, maps:0, contacts:0, [type]:1 })
    );
};

export const listenAnalytics = (uid, callback) => 
    onSnapshot(doc(db, "analytics", uid), snap => snap.exists() && callback(snap.data()));
