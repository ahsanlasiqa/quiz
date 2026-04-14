import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import midtransClient from 'midtrans-client';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

const PACKS = {
  // Starter — bulanan
  'starter_monthly': { price: 19900,  credits: 5,   name: 'DrillSoal Starter — Bulanan',  period: 'monthly', months: 1  },
  // Starter — tahunan (diskon)
  'starter_yearly':  { price: 200000, credits: 60,  name: 'DrillSoal Starter — Tahunan',  period: 'yearly',  months: 12 },
  // Pro — bulanan
  'pro_monthly':     { price: 49900,  credits: 40,  name: 'DrillSoal Pro — Bulanan',      period: 'monthly', months: 1  },
  // Pro — tahunan (diskon)
  'pro_yearly':      { price: 500000, credits: 480, name: 'DrillSoal Pro — Tahunan',      period: 'yearly',  months: 12 },
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

    const packId = req.body?.pack;
    console.log('create-transaction: pack received:', packId, 'email:', email);
    const pack = PACKS[packId];
    if (!pack) return res.status(400).json({ error: `Pack tidak valid: ${packId}` });

    const orderId = `ds-${packId}-${email.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

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
        id: `ds-${packId}`,
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
    console.log('Midtrans transaction created:', orderId, 'pack:', packSize, 'token:', transaction.token?.substring(0,10));

    // Save pending order including snapToken for resume
    await db.collection('orders').doc(orderId).set({
      orderId, email,
      packId,
      amount:   pack.price,
      credits:  pack.credits,
      period:   pack.period,
      months:   pack.months,
      status:   'pending',
      snapToken: transaction.token,
      createdAt: new Date().toISOString(),
    });
    console.log('Order saved to Firestore:', orderId, '| pack:', packId, '| credits:', pack.credits);

    return res.status(200).json({ token: transaction.token, orderId });

  } catch (err) {
    console.error('Midtrans error:', err);
    return res.status(500).json({ error: err.message });
  }
}
