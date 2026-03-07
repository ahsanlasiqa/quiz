// Creates a Midtrans Snap transaction token for monthly subscription payment
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import midtransClient from 'midtrans-client';

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
    const name = decoded.name || email;
    if (!email) return res.status(401).json({ error: 'No email' });

    // Get or create user doc
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : {};

    // Generate unique order ID with timestamp
    const orderId = `quizgen-${email.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    // Price in IDR (Rp 47.000)
    const PRICE_IDR = 47000;
    const SUBSCRIPTION_MONTHS = 1;

    // Init Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: PRICE_IDR,
      },
      item_details: [{
        id: 'quizgen-monthly',
        price: PRICE_IDR,
        quantity: SUBSCRIPTION_MONTHS,
        name: 'QuizGen Langganan Bulanan',
        brand: 'QuizGen',
        category: 'Education',
      }],
      customer_details: {
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email,
      },
      callbacks: {
        finish: `${process.env.APP_URL}?payment=finish`,
        error: `${process.env.APP_URL}?payment=error`,
        pending: `${process.env.APP_URL}?payment=pending`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Save pending order to Firestore
    await db.collection('orders').doc(orderId).set({
      orderId,
      email,
      amount: PRICE_IDR,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      token: transaction.token,
      orderId,
    });

  } catch (err) {
    console.error('Midtrans error:', err);
    return res.status(500).json({ error: err.message });
  }
}
