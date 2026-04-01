// Auth Logic using Firebase popup with redirect fallback
window.quizgenAuthed = false;
window.quizgenUser = null;
window.quizgenAccess = null;

window.getIdToken = async function() {
  if (!window.quizgenUser) return null;
  return await window.quizgenUser.getIdToken(true); // true = force refresh if expired
};

function startAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appScreen   = document.getElementById('app-screen');
  const btnLogin    = document.getElementById('btn-google-login');
  const btnSignout  = document.getElementById('btn-signout');
  const loginError  = document.getElementById('login-error');
  const loginMsg    = document.getElementById('login-msg');

  const urlParams  = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite') || '';

  if (inviteCode && loginMsg) {
    loginMsg.textContent = "🎉 Anda diundang! Masuk dengan Google untuk mendapatkan akses.";
    loginMsg.classList.remove('hidden');
  }

  function showLogin(errorMsg) {
    hideOverlay();
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    loginError.classList.add('hidden');
    if (errorMsg) {
      loginError.textContent = errorMsg;
      loginError.classList.remove('hidden');
    }
    resetLoginBtn();
  }

  function showApp(accessData) {
    hideOverlay();
    window.quizgenAccess = accessData;
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    if (window.updateSubscriptionUI) window.updateSubscriptionUI(accessData);

    // Tampilkan nama & avatar user
    const user = window.quizgenUser;
    if (user) {
      const nameEl   = document.getElementById('user-name');
      const avatarEl = document.getElementById('user-avatar');
      if (nameEl) {
        // Ambil first name saja supaya ringkas
        const firstName = (user.displayName || user.email || '').split(' ')[0];
        nameEl.textContent = firstName;
      }
      if (avatarEl) {
        if (user.photoURL) {
          avatarEl.innerHTML = `<img src="${user.photoURL}" alt="avatar" referrerpolicy="no-referrer"/>`;
        } else {
          // Fallback: inisial
          const initial = (user.displayName || user.email || '?')[0].toUpperCase();
          avatarEl.textContent = initial;
        }
      }
    }

    // Auto-trigger checkout if user came from a paid pricing button
    var pendingPack = sessionStorage.getItem('pendingPack');
    if (pendingPack) {
      sessionStorage.removeItem('pendingPack');
      setTimeout(function() {
        if (window.startCheckout) window.startCheckout(parseInt(pendingPack));
      }, 600);
    }

    // Auto-switch tab if user came from a promo button
    var pendingTab = sessionStorage.getItem('pendingTab');
    var pendingTryout = sessionStorage.getItem('pendingTryout');
    if (pendingTab) {
      sessionStorage.removeItem('pendingTab');
      setTimeout(function() {
        if (window.switchAppMode) {
          window.switchAppMode(pendingTab);
          // If came from TKA promo, auto-start TKA inside tryout hub
          if (pendingTab === 'tryout' && pendingTryout) {
            sessionStorage.removeItem('pendingTryout');
            setTimeout(function() {
              if (window.startTryout) window.startTryout(pendingTryout);
            }, 200);
          }
        }
      }, 400);
    }
  }

  function resetLoginBtn() {
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" /> Masuk dengan Google';
  }

  function setBtnLoading(text) {
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="btn-spinner"></span> ' + text;
  }

  function showOverlay(text) {
    var el = document.getElementById('login-overlay');
    var txt = document.getElementById('login-overlay-text');
    if (el) el.classList.remove('hidden');
    if (txt) txt.textContent = text || 'Memproses…';
  }
  function hideOverlay() {
    var el = document.getElementById('login-overlay');
    if (el) el.classList.add('hidden');
  }

  async function checkAndShowApp(user) {
    try {
      const idToken = await user.getIdToken(true);
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
        showLogin(data.error || 'Access denied.');
      }
    } catch (err) {
      console.error('checkAndShowApp error:', err);
      await window.firebaseAuth.signOut();
      showLogin('Could not verify your account. Please try again.');
    }
  }

  // Show login initially
  showLogin();

  // Listen for auth state — covers both popup success and persistent sessions
  window.firebaseAuth.onAuthStateChanged(function(user) {
    console.log('onAuthStateChanged:', user ? user.email : 'null');
    if (user && !window.quizgenAuthed) {
      setBtnLoading('Verifying…');
      showOverlay('Memverifikasi akun…');
      checkAndShowApp(user);
    } else if (!user && !window.quizgenAuthed) {
      showLogin();
    }
  });

  // Sign in button — popup mode
  btnLogin.addEventListener('click', function() {
    loginError.classList.add('hidden');
    setBtnLoading('Opening Google…');

    window.firebaseAuth.signInWithPopup(window.googleProvider)
      .then(function(result) {
        // onAuthStateChanged will handle the rest — show overlay now
        showOverlay('Masuk dengan Google…');
        console.log('Popup success:', result.user.email);
      })
      .catch(function(err) {
        console.error('Popup failed:', err.code, err.message);
        hideOverlay();
        if (err.code === 'auth/popup-blocked' ||
            err.code === 'auth/operation-not-supported-in-this-environment') {
          // Fall back to redirect
          setBtnLoading('Redirecting…');
          showOverlay('Mengalihkan ke Google…');
          window.firebaseAuth.signInWithRedirect(window.googleProvider);
        } else if (err.code === 'auth/popup-closed-by-user' ||
                   err.code === 'auth/cancelled-popup-request') {
          showLogin();
        } else {
          showLogin('Sign-in failed: ' + err.message);
        }
      });
  });

  // Handle redirect result (when coming back from Google)
  window.firebaseAuth.getRedirectResult()
    .then(function(result) {
      if (result && result.user) {
        console.log('Redirect result user:', result.user.email);
        // onAuthStateChanged handles it
      }
    })
    .catch(function(err) {
      console.error('getRedirectResult error:', err.code, err.message);
      if (err.code !== 'auth/no-auth-event') {
        showLogin('Sign-in failed: ' + err.message);
      }
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

// Hook landing page buttons after DOM is ready
function hookLandingButtons() {
  ['btn-coba-gratis', 'btn-coba-free', 'btn-google-nav', 'btn-coba-pain', 'btn-coba-gratis-cpns'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function() {
      document.getElementById('btn-google-login').click();
    });
  });
  var btnTkaPromo = document.getElementById('btn-tka-promo');
  if (btnTkaPromo) btnTkaPromo.addEventListener('click', function() {
    sessionStorage.setItem('pendingTab', 'tryout');
    sessionStorage.setItem('pendingTryout', 'tka');
    document.getElementById('btn-google-login').click();
  });
  var btnPop = document.getElementById('btn-coba-pop');
  if (btnPop) btnPop.addEventListener('click', function() {
    sessionStorage.setItem('pendingPack', '40');
    document.getElementById('btn-google-login').click();
  });
  var btn30 = document.getElementById('btn-coba-30');
  if (btn30) btn30.addEventListener('click', function() {
    sessionStorage.setItem('pendingPack', '20');
    document.getElementById('btn-google-login').click();
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hookLandingButtons);
} else {
  hookLandingButtons();
}

if (window.firebaseReady) {
  startAuth();
} else {
  window.addEventListener('firebase-ready', startAuth);
}
