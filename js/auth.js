// ── Auth Logic ──────────────────────────────
window.quizgenAuthed = false;
window.quizgenUser = null;
window.quizgenAccess = null; // 'invited' | 'subscribed' | 'free_trial' | 'trial_expired'

window.getIdToken = async function() {
  if (!window.quizgenUser) return null;
  return await window.quizgenUser.getIdToken();
};

window.initAuth = function() {
  const loginScreen  = document.getElementById('login-screen');
  const appScreen    = document.getElementById('app-screen');
  const btnLogin     = document.getElementById('btn-google-login');
  const btnSignout   = document.getElementById('btn-signout');
  const loginError   = document.getElementById('login-error');
  const loginMsg     = document.getElementById('login-msg');

  const urlParams  = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite') || '';

  if (inviteCode) {
    loginMsg.textContent = "🎉 You've been invited! Sign in with Google to get access.";
    loginMsg.classList.remove('hidden');
  }

  function showLogin(errorMsg) {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    if (errorMsg) {
      loginError.textContent = errorMsg;
      loginError.classList.remove('hidden');
    } else {
      loginError.classList.add('hidden');
    }
  }

  function showApp(accessData) {
    window.quizgenAccess = accessData;
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    if (inviteCode) window.history.replaceState({}, '', window.location.pathname);
    // Update subscription UI
    if (window.updateSubscriptionUI) window.updateSubscriptionUI(accessData);
  }

  function resetLoginBtn() {
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" /> Sign in with Google`;
  }

  window.firebaseAuth.onAuthStateChanged(async user => {
    if (!user) { showLogin(); return; }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/check-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, inviteCode })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        window.quizgenAuthed = true;
        window.quizgenUser = user;
        showApp(data);
      } else {
        await window.firebaseAuth.signOut();
        resetLoginBtn();
        showLogin(data.error || 'Access denied.');
      }
    } catch (err) {
      await window.firebaseAuth.signOut();
      resetLoginBtn();
      showLogin('Could not verify your account. Please try again.');
    }
  });

  btnLogin.addEventListener('click', async () => {
    loginError.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = `<span class="btn-spinner"></span> Signing in…`;
    try {
      await window.firebaseAuth.signInWithPopup(window.googleProvider);
    } catch (err) {
      resetLoginBtn();
      if (err.code !== 'auth/popup-closed-by-user') showLogin('Sign-in failed. Please try again.');
    }
  });

  btnSignout.addEventListener('click', async () => {
    await window.firebaseAuth.signOut();
    window.quizgenAuthed = false;
    window.quizgenUser = null;
    window.quizgenAccess = null;
    showLogin();
  });
};
