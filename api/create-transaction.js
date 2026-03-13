import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import midtransClient from 'midtrans-client';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

const PACKS = {
  30: { price: 29900, credits: 30, name: 'DrillSoal 30 Credits' },
  60: { price: 49900, credits: 60, name: 'DrillSoal 60 Credits' },
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

    const packSize = parseInt(req.body?.pack) === 30 ? 30 : 60;
    const pack = PACKS[packSize];
    const orderId = `quizgen-${packSize}cr-${email.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: pack.price,
      },
      item_details: [{
        id: `quizgen-credits-${packSize}`,
        price: pack.price,
        quantity: 1,
        name: pack.name,
        brand: 'DrillSoal',
        category: 'Education',
      }],
      customer_details: {
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email,
      },
      callbacks: {
        finish: `${process.env.APP_URL || 'https://quiz-pi-kohl.vercel.app'}?payment=finish`,
        error:  `${process.env.APP_URL || 'https://quiz-pi-kohl.vercel.app'}?payment=error`,
        pending:`${process.env.APP_URL || 'https://quiz-pi-kohl.vercel.app'}?payment=pending`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Save pending order including snapToken for resume
    await db.collection('orders').doc(orderId).set({
      orderId, email,
      amount: pack.price,
      credits: pack.credits,
      status: 'pending',
      snapToken: transaction.token,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ token: transaction.token, orderId });

  } catch (err) {
    console.error('Midtrans error:', err);
    return res.status(500).json({ error: err.message });
  }
}
