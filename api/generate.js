import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' }, maxDuration: 60 }
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

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(403).json({ error: 'User not found' });

    const user = userDoc.data();
    const isInvited = user.isInvited || false;
    const credits = user.credits ?? 0;

    // Invited users always have unlimited access
    if (!isInvited && credits <= 0) {
      return res.status(403).json({ error: 'no_credits' });
    }

    // Call Anthropic API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Deduct 1 credit (invited users are exempt)
    if (!isInvited) {
      await userRef.update({ credits: FieldValue.increment(-1) });
    }

    // Return remaining credits along with response
    return res.status(200).json({
      ...data,
      _credits: isInvited ? null : credits - 1,
    });

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}
