// Firebase Configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC07qBPE1gsAFckEEbwvhCouhfCN4dcniU",
  authDomain: "tapmap-a7e1d.firebaseapp.com",
  projectId: "tapmap-a7e1d",
  storageBucket: "tapmap-a7e1d.firebasestorage.app",
  messagingSenderId: "1073914424721",
  appId: "1:1073914424721:web:dd9fa3f530cd9c74be3e30",
  measurementId: "G-EWQGY2LEFC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open, persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.log('Browser doesn\'t support persistence');
        }
    });

// Make Firebase services globally available
window.auth = auth;
window.db = db;
window.storage = storage;