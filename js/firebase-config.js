// Firebase config loaded from server — keeps keys out of GitHub
(async function() {
  try {
    const res = await fetch('/api/firebase-client-config');
    const firebaseConfig = await res.json();

    if (firebaseConfig.error) {
      console.error('Firebase config error:', firebaseConfig.error);
      return;
    }

    firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.googleProvider = new firebase.auth.GoogleAuthProvider();

    // Signal that Firebase is ready
    window.firebaseReady = true;
    window.dispatchEvent(new Event('firebase-ready'));

  } catch (err) {
    console.error('Failed to load Firebase config:', err);
  }
})();
