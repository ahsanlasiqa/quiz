import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: false, maxDuration: 10 }
};

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-id-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const idToken = req.headers['x-id-token'];
  if (!idToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    await auth.verifyIdToken(idToken);

    const jenjang = req.query.jenjang;
    if (!jenjang || !['SD','SMP','SMA'].includes(jenjang)) {
      return res.status(400).json({ error: 'Invalid jenjang' });
    }

    const snap = await db.collection('tka_best')
      .where('jenjang', '==', jenjang)
      .orderBy('pct', 'desc')
      .orderBy('elapsedSeconds', 'asc')
      .limit(50)
      .get();

    const entries = snap.docs.map(doc => {
      const d = doc.data();
      return {
        displayName: d.displayName,
        email: d.email,
        pct: d.pct,
        totalCorrect: d.totalCorrect,
        totalQuestions: d.totalQuestions,
        elapsedSeconds: d.elapsedSeconds,
      };
    });

    return res.status(200).json({ entries });

  } catch (err) {
    console.error('TKA leaderboard error:', err);
    return res.status(500).json({ error: err.message });
  }
}
