// Firebase config loaded from server
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
    window.firebaseProjectId = firebaseConfig.projectId;

    window.firebaseReady = true;
    window.dispatchEvent(new Event('firebase-ready'));

  } catch (err) {
    console.error('Failed to load Firebase config:', err);
  }
})();
