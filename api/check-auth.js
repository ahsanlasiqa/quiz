import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

const FREE_CREDITS = 3;

// Label paket untuk ditampilkan ke user
const PACK_LABELS = {
  starter_monthly: 'Starter Bulanan',
  starter_yearly:  'Starter Tahunan',
  pro_monthly:     'Pro Bulanan',
  pro_yearly:      'Pro Tahunan',
};

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
    const db = getFirestore(app);
    const auth = getAuth(app);

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
        credits: FREE_CREDITS,
        totalPurchased: 0,
      });
      return res.status(200).json({
        ok: true, email,
        isInvited: validInvite,
        credits: FREE_CREDITS,
        subscriptionStatus: 'free',
        subscriptionPackId: null,
        subscriptionPackLabel: null,
        subscriptionExpiresAt: null,
        newUser: true,
      });
    }

    // ── EXISTING USER ─────────────────────────
    const user = userDoc.data();
    const now  = new Date();

    // Cek apakah subscription masih aktif
    const expiresAt  = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const isActive   = expiresAt && expiresAt > now;
    let   credits    = user.credits ?? 0;
    let   subStatus  = 'free';
    let   dbUpdate   = null;

    if (isActive) {
      subStatus = 'active';
    } else if (expiresAt && expiresAt <= now) {
      // Expired — reset kredit ke 0
      subStatus = 'expired';
      if (credits > 0) {
        credits  = 0;
        dbUpdate = { credits: 0 };
      }
    }

    if (dbUpdate) await userRef.update(dbUpdate);

    return res.status(200).json({
      ok: true, email,
      isInvited:              user.isInvited || false,
      credits,
      subscriptionStatus:     subStatus,
      subscriptionPackId:     user.subscriptionPackId    || null,
      subscriptionPackLabel:  PACK_LABELS[user.subscriptionPackId] || null,
      subscriptionExpiresAt:  user.subscriptionExpiresAt || null,
    });

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Auth check failed: ' + err.message });
  }
}
