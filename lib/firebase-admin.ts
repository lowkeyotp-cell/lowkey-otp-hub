import fs from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;

if (!keyPath) {
  throw new Error(
    "FIREBASE_ADMIN_KEY_PATH environment variable is not configured."
  );
}

if (!fs.existsSync(keyPath)) {
  throw new Error(
    `Firebase service account file not found: ${keyPath}`
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(keyPath, "utf8")
);

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
