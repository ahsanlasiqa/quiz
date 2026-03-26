import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-id-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const idToken = req.headers['x-id-token'];
  if (!idToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) return res.status(401).json({ error: 'No email in token' });

    // Check and deduct credit
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(403).json({ error: 'User not found' });

    const user = userDoc.data();
    const isInvited = user.isInvited || false;
    const credits = user.credits ?? 0;

    if (!isInvited && credits <= 0) {
      return res.status(403).json({ error: 'no_credits' });
    }

    const {
      jenjang, jenjangLabel, totalCorrect, totalQuestions,
      pct, scores, elapsedSeconds, displayName
    } = req.body;

    if (!jenjang || !['SD','SMP','SMA'].includes(jenjang)) {
      return res.status(400).json({ error: 'Invalid jenjang' });
    }

    // Save result to tka_results collection
    const resultRef = db.collection('tka_results').doc();
    await resultRef.set({
      email,
      displayName: displayName || email,
      jenjang,
      jenjangLabel: jenjangLabel || jenjang,
      totalCorrect,
      totalQuestions,
      pct,
      scores,
      elapsedSeconds,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update user's best score per jenjang
    const bestRef = db.collection('tka_best').doc(`${email}_${jenjang}`);
    const bestDoc = await bestRef.get();
    if (!bestDoc.exists || bestDoc.data().pct < pct) {
      await bestRef.set({
        email,
        displayName: displayName || email,
        jenjang,
        jenjangLabel: jenjangLabel || jenjang,
        totalCorrect,
        totalQuestions,
        pct,
        scores,
        elapsedSeconds,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Deduct 1 credit
    if (!isInvited) {
      await userRef.update({ credits: FieldValue.increment(-1) });
    }

    // Get rank for this user in jenjang (based on best scores)
    const leaderSnap = await db.collection('tka_best')
      .where('jenjang', '==', jenjang)
      .orderBy('pct', 'desc')
      .get();

    let rank = null;
    leaderSnap.docs.forEach((doc, i) => {
      if (doc.data().email === email) rank = i + 1;
    });

    return res.status(200).json({
      ok: true,
      rank,
      _credits: isInvited ? null : credits - 1,
    });

  } catch (err) {
    console.error('TKA submit error:', err);
    return res.status(500).json({ error: err.message });
  }
}
