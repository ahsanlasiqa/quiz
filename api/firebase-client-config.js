// Serves Firebase client config from environment variables
// This keeps all keys out of the GitHub repo
export const config = {
  api: { bodyParser: false, maxDuration: 5 }
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  // These are SAFE to expose to the browser — Firebase client keys are
  // public by design, but we restrict them by domain in Google Cloud Console
  const cfg = {
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID,
  };

  // Check all values are present
  const missing = Object.entries(cfg).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    return res.status(500).json({ error: 'Missing Firebase config: ' + missing.join(', ') });
  }

  res.status(200).json(cfg);
}
