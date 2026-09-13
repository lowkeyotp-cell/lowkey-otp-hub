import { initializeApp } from "firebase/app";

import {
  getAuth
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD1KKnsUtNjYOx-yt8fyoqaisnwudTEZ20",
  authDomain: "lowkey-otp-hub.vercel.app",
  projectId: "otp-marketplace",
  storageBucket: "otp-marketplace.firebasestorage.app",
  messagingSenderId: "930335542188",
  appId: "1:930335542188:web:9e960b7885964d5cf10809",
};

export const app =
  initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);

export const storage =
  getStorage(app);
