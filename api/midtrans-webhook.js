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

// Hitung tanggal berakhir berdasarkan months dari order
function calcExpiresAt(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + (months || 1));
  return d.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const app = getAdminApp();
    const db = getFirestore(app);

    const {
      order_id, status_code, gross_amount, signature_key,
      transaction_status, fraud_status,
    } = req.body;

    // Verify signature
    const expectedSig = verifySignature(
      order_id, status_code, gross_amount,
      process.env.MIDTRANS_SERVER_KEY
    );
    if (signature_key !== expectedSig) {
      console.error('Webhook: invalid signature for', order_id);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const orderRef = db.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      console.error('Webhook: order not found', order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order   = orderDoc.data();
    const email   = order.email;
    const credits = order.credits || 5;   // kredit dari paket yang dibeli
    const months  = order.months  || 1;   // durasi dari paket
    const packId  = order.packId  || '';

    console.log('Webhook received:', order_id, '| status:', transaction_status,
      '| email:', email, '| credits:', credits, '| months:', months);

    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement';

    if (isSuccess) {
      const paidAt       = new Date().toISOString();
      const expiresAt    = calcExpiresAt(months);
      const userRef      = db.collection('users').doc(email);
      const userDoc      = await userRef.get();
      const currentUser  = userDoc.exists ? userDoc.data() : {};

      // Jika user sudah punya subscription aktif yang belum expired,
      // perpanjang dari tanggal berakhir yang lama (bukan dari sekarang)
      let baseDate = new Date();
      if (currentUser.subscriptionExpiresAt) {
        const existingExp = new Date(currentUser.subscriptionExpiresAt);
        if (existingExp > baseDate) baseDate = existingExp;
      }
      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

      await userRef.set({
        // Set kredit ke nilai paket (bukan increment) — reset per periode
        credits:                credits,
        subscriptionPackId:     packId,
        subscriptionExpiresAt:  newExpiresAt.toISOString(),
        totalPurchased:         FieldValue.increment(credits),
        lastPurchaseAt:         paidAt,
      }, { merge: true });

      await orderRef.update({
        status: 'paid',
        paidAt,
        subscriptionExpiresAt: newExpiresAt.toISOString(),
      });

      console.log('Webhook: order paid', order_id,
        '| credits set to', credits,
        '| expires:', newExpiresAt.toISOString());

    } else if (transaction_status === 'pending') {
      await orderRef.update({ status: 'pending' });

    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
      await orderRef.update({ status: 'failed' });
      console.log('Webhook: order failed/cancelled', order_id);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
