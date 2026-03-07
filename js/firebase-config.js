// ── Firebase Configuration ──────────────────
// Replace these values with your own Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → Web
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
window.firebaseAuth = firebase.auth();
window.googleProvider = new firebase.auth.GoogleAuthProvider();
