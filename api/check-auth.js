import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

const FREE_QUIZ_LIMIT = 3;

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idToken, inviteCode } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing token' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) return res.status(401).json({ error: 'No email in token' });

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    // ── NEW USER ──────────────────────────────
    if (!userDoc.exists) {
      const validInvite = inviteCode && inviteCode.trim() === (process.env.INVITE_CODE || '').trim();
      await userRef.set({
        email,
        name: decoded.name || '',
        createdAt: new Date().toISOString(),
        isInvited: validInvite,
        freeQuizzesUsed: 0,
        subscriptionStatus: 'none',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionEnd: null,
      });
      return res.status(200).json({
        ok: true, email,
        access: 'free_trial',
        freeQuizzesUsed: 0,
        freeQuizzesLimit: FREE_QUIZ_LIMIT,
        isInvited: validInvite,
        newUser: true
      });
    }

    // ── EXISTING USER ─────────────────────────
    const user = userDoc.data();

    // Invited users always have full access
    if (user.isInvited) {
      return res.status(200).json({ ok: true, email, access: 'invited' });
    }

    // Active subscriber
    if (user.subscriptionStatus === 'active') {
      return res.status(200).json({
        ok: true, email, access: 'subscribed',
        subscriptionEnd: user.subscriptionEnd
      });
    }

    // Free trial remaining
    if (user.freeQuizzesUsed < FREE_QUIZ_LIMIT) {
      return res.status(200).json({
        ok: true, email,
        access: 'free_trial',
        freeQuizzesUsed: user.freeQuizzesUsed,
        freeQuizzesLimit: FREE_QUIZ_LIMIT
      });
    }

    // Trial expired, not subscribed
    return res.status(200).json({
      ok: true, email,
      access: 'trial_expired',
      freeQuizzesUsed: user.freeQuizzesUsed,
      freeQuizzesLimit: FREE_QUIZ_LIMIT
    });

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Auth check failed: ' + err.message });
  }
}
