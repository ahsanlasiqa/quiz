import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const config = {
  api: { bodyParser: false, maxDuration: 15 }
};

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const app = getAdminApp();
  const db = getFirestore(app);

  async function updateUser(customerId, updates) {
    const snap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update(updates);
    }
  }

  try {
    switch (event.type) {

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await updateUser(sub.customer, {
          subscriptionStatus: isActive ? 'active' : sub.status,
          stripeSubscriptionId: sub.id,
          subscriptionEnd: new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await updateUser(sub.customer, {
          subscriptionStatus: 'cancelled',
          stripeSubscriptionId: null,
          subscriptionEnd: null,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object;
        await updateUser(inv.customer, { subscriptionStatus: 'past_due' });
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
