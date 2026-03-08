// Firebase config is loaded from the server to keep keys out of GitHub
// The actual values are stored as Vercel environment variables
(async function() {
  try {
    const res = await fetch('/api/firebase-client-config');
    const firebaseConfig = await res.json();

    if (firebaseConfig.error) {
      console.error('Firebase config error:', firebaseConfig.error);
      document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif"><h2>Configuration error</h2><p>Please contact the app owner.</p></div>';
      return;
    }

    firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.googleProvider = new firebase.auth.GoogleAuthProvider();

    // Now safe to init auth and app
    if (window.initAuth) window.initAuth();

  } catch (err) {
    console.error('Failed to load Firebase config:', err);
  }
})();
