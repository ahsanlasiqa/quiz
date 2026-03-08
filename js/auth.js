// Auth Logic — waits for Firebase to be ready before initializing
window.quizgenAuthed = false;
window.quizgenUser = null;
window.quizgenAccess = null;

window.getIdToken = async function() {
  if (!window.quizgenUser) return null;
  return await window.quizgenUser.getIdToken();
};

function startAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appScreen   = document.getElementById('app-screen');
  const btnLogin    = document.getElementById('btn-google-login');
  const btnSignout  = document.getElementById('btn-signout');
  const loginError  = document.getElementById('login-error');
  const loginMsg    = document.getElementById('login-msg');

  if (!btnLogin) { console.error('btn-google-login not found'); return; }

  const urlParams  = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite') || '';

  if (inviteCode && loginMsg) {
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
    if (window.updateSubscriptionUI) window.updateSubscriptionUI(accessData);
  }

  function resetLoginBtn() {
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" /> Sign in with Google';
  }

  async function checkAndShowApp(user) {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/check-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken, inviteCode: inviteCode })
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
      console.error('Auth check error:', err);
      await window.firebaseAuth.signOut();
      resetLoginBtn();
      showLogin('Could not verify your account. Please try again.');
    }
  }

  // Show login screen immediately
  showLogin();

  // Handle redirect result first (for mobile browsers that use redirect instead of popup)
  window.firebaseAuth.getRedirectResult().then(function(result) {
    if (result && result.user) {
      btnLogin.disabled = true;
      btnLogin.innerHTML = '<span class="btn-spinner"></span> Verifying…';
      checkAndShowApp(result.user);
    }
  }).catch(function(err) {
    console.error('Redirect result error:', err);
    if (err.code !== 'auth/no-auth-event') {
      showLogin('Sign-in failed (' + err.code + '). Please try again.');
    }
  });

  // Watch Firebase auth state
  window.firebaseAuth.onAuthStateChanged(async function(user) {
    if (!user) { showLogin(); return; }
    // Only handle if not already processing a redirect
    if (!window.quizgenAuthed) {
      checkAndShowApp(user);
    }
  });

  // Sign in button — try popup first, fall back to redirect
  btnLogin.addEventListener('click', function() {
    loginError.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="btn-spinner"></span> Signing in…';

    window.firebaseAuth.signInWithPopup(window.googleProvider)
      .catch(function(err) {
        console.error('Popup error:', err.code);
        // If popup fails, fall back to redirect (works on all mobile browsers)
        if (err.code === 'auth/popup-blocked' ||
            err.code === 'auth/popup-closed-by-user' ||
            err.code === 'auth/cancelled-popup-request' ||
            err.code === 'auth/operation-not-supported-in-this-environment') {
          btnLogin.innerHTML = '<span class="btn-spinner"></span> Redirecting…';
          window.firebaseAuth.signInWithRedirect(window.googleProvider);
        } else {
          resetLoginBtn();
          showLogin('Sign-in failed (' + err.code + '). Please try again.');
        }
      });
  });

  // Sign out
  btnSignout.addEventListener('click', function() {
    window.firebaseAuth.signOut().then(function() {
      window.quizgenAuthed = false;
      window.quizgenUser = null;
      window.quizgenAccess = null;
      showLogin();
    });
  });
}

// Wait for Firebase to be ready
if (window.firebaseReady) {
  startAuth();
} else {
  window.addEventListener('firebase-ready', startAuth);
}
