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

export const registerUser = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () =>
    signOut(auth);

export const listenAuth = (callback) =>
    onAuthStateChanged(auth, callback);

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

    await updateDoc(ref, {
        [type]: increment(1)
    }).catch(() =>
        setDoc(ref, {
            views: 0,
            scans: 0,
            maps: 0,
            contacts: 0,
            [type]: 1
        })
    );
};

export const listenAnalytics = (uid, callback) => {
    return onSnapshot(doc(db, "analytics", uid), (snap) => {
        if (snap.exists()) callback(snap.data());
    });
};