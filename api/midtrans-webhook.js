import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 15 }
};

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

function verifySignature(orderId, statusCode, grossAmount, serverKey) {
  const str = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash('sha512').update(str).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const app = getAdminApp();
    const db = getFirestore(app);

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type } = req.body;

    // Verify signature
    const expectedSig = verifySignature(order_id, status_code, gross_amount, process.env.MIDTRANS_SERVER_KEY);
    if (signature_key !== expectedSig) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const orderRef = db.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });

    const order = orderDoc.data();
    const email = order.email;
    const creditsToAdd = order.credits || 60;

    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement';

    if (isSuccess) {
      // Add credits to user
      await db.collection('users').doc(email).update({
        credits: FieldValue.increment(creditsToAdd),
        totalPurchased: FieldValue.increment(creditsToAdd),
        lastPurchaseAt: new Date().toISOString(),
      });
      await orderRef.update({ status: 'paid', paidAt: new Date().toISOString() });

    } else if (transaction_status === 'pending') {
      await orderRef.update({ status: 'pending' });

    } else if (['deny','cancel','expire','failure'].includes(transaction_status)) {
      await orderRef.update({ status: 'failed' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
