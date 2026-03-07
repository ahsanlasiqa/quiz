// ── Firebase Configuration ──────────────────
// Replace these values with your own Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → Web
const firebaseConfig = {
  apiKey: "AIzaSyCdGUw0s01tUQKu1Xuqy03srW0ndT2Zy40",
  authDomain: "quizgen-b244d.firebaseapp.com",
  projectId: "quizgen-b244d",
  storageBucket: "quizgen-b244d.firebasestorage.app",
  messagingSenderId: "642908662787",
  appId: "1:642908662787:web:a6163cee38a1675b2c7236"
};

firebase.initializeApp(firebaseConfig);
window.firebaseAuth = firebase.auth();
window.googleProvider = new firebase.auth.GoogleAuthProvider();
