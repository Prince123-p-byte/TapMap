import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    increment, 
    onSnapshot,
    collection,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    deleteUser
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyC07qBPE1gsAFckEEbwvhCouhfCN4dcniU",
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
            name: email.split('@')[0] || "My Business",
            tagline: "Welcome to my business",
            desc: "Tell people about your business",
            address: "Set your location",
            phone: "",
            email: email,
            portfolio: [],
            location: { lat: 40.7128, lng: -74.0060 },
            createdAt: new Date().toISOString(),
            profileImage: null,
            coverImage: null
        });
        
        // Initialize analytics
        await setDoc(doc(db, "analytics", userCred.user.uid), {
            views: 0,
            scans: 0,
            maps: 0,
            contacts: 0,
            today: 0,
            week: 0
        });
        
        return userCred.user;
    } catch (err) {
        console.error("Registration error:", err);
        if(err.code === "auth/email-already-in-use") throw new Error("This email is already registered.");
        if(err.code === "auth/invalid-email") throw new Error("Invalid email address.");
        if(err.code === "auth/weak-password") throw new Error("Password should be at least 6 characters.");
        throw new Error("Registration failed. Please try again.");
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        return userCred.user;
    } catch(err) {
        console.error("Login error:", err);
        if(err.code === "auth/user-not-found") throw new Error("No account found with this email.");
        if(err.code === "auth/wrong-password") throw new Error("Incorrect password.");
        if(err.code === "auth/invalid-email") throw new Error("Invalid email address.");
        throw new Error("Login failed. Please try again.");
    }
};

export const logoutUser = () => signOut(auth);

export const listenAuth = (callback) => onAuthStateChanged(auth, callback);

export const deleteUserAccount = async (user) => {
    try {
        // Delete business data from Firestore
        await deleteDoc(doc(db, "businesses", user.uid));
        await deleteDoc(doc(db, "analytics", user.uid));
        
        // Delete all messages
        const messagesQuery = query(collection(db, "messages"), where("participants", "array-contains", user.uid));
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(async (messageDoc) => {
            await deleteDoc(messageDoc.ref);
        });
        
        // Delete the user account
        await deleteUser(user);
    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
};

/* =========================
   BUSINESS FUNCTIONS
========================= */

export const saveBusiness = async (uid, data) => {
    try {
        await setDoc(doc(db, "businesses", uid), data, { merge: true });
    } catch (error) {
        console.error("Error saving business:", error);
        throw error;
    }
};

export const loadBusiness = async (uid) => {
    try {
        const snap = await getDoc(doc(db, "businesses", uid));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error("Error loading business:", error);
        return null;
    }
};

export const listenBusiness = (uid, callback) => {
    return onSnapshot(doc(db, "businesses", uid), (snap) => {
        if (snap.exists()) {
            callback(snap.data());
        }
    }, (error) => {
        console.error("Error listening to business:", error);
    });
};

export const listenAllBusinesses = (callback) => {
    return onSnapshot(collection(db, "businesses"), (snapshot) => {
        const businesses = [];
        snapshot.forEach((doc) => {
            businesses.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(businesses);
    }, (error) => {
        console.error("Error listening to businesses:", error);
    });
};

/* =========================
   MESSAGING FUNCTIONS
========================= */

export const sendMessage = async (fromUid, toUid, content) => {
    try {
        const messageData = {
            from: fromUid,
            to: toUid,
            content: content,
            timestamp: serverTimestamp(),
            read: false,
            participants: [fromUid, toUid]
        };
        
        await addDoc(collection(db, "messages"), messageData);
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const listenForMessages = (uid, callback) => {
    const q = query(
        collection(db, "messages"), 
        where("participants", "array-contains", uid),
        orderBy("timestamp", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(messages);
    }, (error) => {
        console.error("Error listening to messages:", error);
    });
};

/* =========================
   ANALYTICS
========================= */

export const logActivity = async (uid, type) => {
    if (!uid) return;
    const ref = doc(db, "analytics", uid);
    const today = new Date().toDateString();
    
    try {
        await updateDoc(ref, { 
            [type]: increment(1),
            [today]: increment(1)
        });
    } catch {
        try {
            await setDoc(ref, { 
                views: 0, 
                scans: 0, 
                maps: 0, 
                contacts: 0,
                [type]: 1,
                [today]: 1
            });
        } catch (error) {
            console.error("Error logging activity:", error);
        }
    }
};

export const listenAnalytics = (uid, callback) => {
    if (!uid) return;
    return onSnapshot(doc(db, "analytics", uid), snap => {
        if (snap.exists()) {
            callback(snap.data());
        } else {
            callback({ views: 0, scans: 0, maps: 0, contacts: 0 });
        }
    }, (error) => {
        console.error("Error listening to analytics:", error);
    });
};

