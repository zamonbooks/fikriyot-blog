import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  // Firebase Admin SDK uchun service account key kerak
  // Hozircha client SDK dan foydalanamiz
  // Keyinchalik production uchun service account qo'shamiz
  app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);

export default app;
