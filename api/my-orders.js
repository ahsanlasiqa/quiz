import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const config = {
  api: { bodyParser: false, maxDuration: 15 }
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
  if (req.method !== 'GET') return res.status(405).end();

  const idToken = req.headers['x-id-token'];
  if (!idToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) return res.status(401).json({ error: 'No email' });

    const snapshot = await db.collection('orders')
      .where('email', '==', email)
      .limit(100)
      .get();

    console.log(`my-orders: found ${snapshot.docs.length} orders for ${email}`);

    const orders = snapshot.docs
      .map(doc => {
        const d = doc.data();
        return {
          orderId: d.orderId,
          amount: d.amount,
          credits: d.credits,
          status: d.status,
          createdAt: d.createdAt,
          paidAt: d.paidAt || null,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('my-orders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
