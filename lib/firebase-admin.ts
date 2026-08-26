import fs from "fs";
import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const json = process.env.FIREBASE_ADMIN_KEY;

  // Vercel / production
  if (json) {
    try {
      return JSON.parse(json);
    } catch {
      throw new Error(
        "FIREBASE_ADMIN_KEY contains invalid JSON."
      );
    }
  }

  // Local Termux development
  const keyPath =
    process.env.FIREBASE_ADMIN_KEY_PATH;

  if (keyPath && fs.existsSync(keyPath)) {
    try {
      return JSON.parse(
        fs.readFileSync(keyPath, "utf8")
      );
    } catch {
      throw new Error(
        "Firebase service account file contains invalid JSON."
      );
    }
  }

  throw new Error(
    "Firebase Admin credentials are not configured."
  );
}

const serviceAccount = getServiceAccount();

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
