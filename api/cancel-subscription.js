import Stripe from 'stripe';
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

  const idToken = req.headers['x-id-token'];
  if (!idToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    const userDoc = await db.collection('users').doc(email).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const { stripeSubscriptionId } = userDoc.data();
    if (!stripeSubscriptionId) return res.status(400).json({ error: 'No active subscription' });

    // Cancel at period end (user keeps access until end of billing period)
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    return res.status(200).json({ ok: true, message: 'Subscription will cancel at end of billing period.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
