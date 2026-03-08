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
    loginError.classList.add('hidden');
    if (errorMsg) {
      loginError.textContent = errorMsg;
      loginError.classList.remove('hidden');
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

  // Show loading state while checking redirect result
  loginScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
  btnLogin.disabled = true;
  btnLogin.innerHTML = '<span class="btn-spinner"></span> Checking…';

  // Use the redirect result already fetched in firebase-config.js
  const redirectResult = window._redirectResult;
  const redirectError  = window._redirectError;

  if (redirectError && redirectError.code !== 'auth/no-auth-event') {
    console.error('Redirect error:', redirectError);
    resetLoginBtn();
    showLogin('Sign-in failed (' + redirectError.code + '). Please try again.');
  } else if (redirectResult && redirectResult.user) {
    // Coming back from Google redirect — verify and enter app
    checkAndShowApp(redirectResult.user);
  } else {
    // No redirect in progress — show normal login
    resetLoginBtn();
    showLogin();

    // Also check if already signed in (persistent session)
    window.firebaseAuth.onAuthStateChanged(function(user) {
      if (user && !window.quizgenAuthed) {
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="btn-spinner"></span> Signing in…';
        checkAndShowApp(user);
      } else if (!user) {
        resetLoginBtn();
        showLogin();
      }
    });
  }

  // Sign in button
  btnLogin.addEventListener('click', function() {
    loginError.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="btn-spinner"></span> Redirecting to Google…';
    window.firebaseAuth.signInWithRedirect(window.googleProvider);
  });

  // Sign out
  btnSignout.addEventListener('click', function() {
    window.firebaseAuth.signOut().then(function() {
      window.quizgenAuthed = false;
      window.quizgenUser = null;
      window.quizgenAccess = null;
      resetLoginBtn();
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
