// Firebase Configuration
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

// GitHub Pages URL for sharing
const APP_URL = "https://prince123-p-byte.github.io/TapMap"; // Replace with your actual GitHub Pages URL

// Enable persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open, persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.log('Browser doesn\'t support persistence');
        }
    });

// Make Firebase services and APP_URL globally available
window.auth = auth;
window.db = db;
window.storage = storage;
window.APP_URL = APP_URL;