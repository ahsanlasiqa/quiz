import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  if (req.method !== 'POST') return res.status(405).end();

  const idToken = req.headers['x-id-token'];
  if (!idToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) return res.status(401).json({ error: 'No email' });

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });

    const order = orderDoc.data();

    // Security: only owner can resume
    if (order.email !== email) return res.status(403).json({ error: 'Forbidden' });

    // Only pending orders can be resumed
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order sudah ' + order.status });
    }

    // Return stored snapToken if still valid
    if (order.snapToken) {
      return res.status(200).json({ token: order.snapToken, orderId });
    }

    // snapToken not stored (old order) — inform user
    return res.status(400).json({ error: 'Token tidak tersedia. Silakan buat transaksi baru.' });

  } catch (err) {
    console.error('resume-order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
