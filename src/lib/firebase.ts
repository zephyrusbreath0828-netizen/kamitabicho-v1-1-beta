/**
 * Firebase 初期化（クライアント SDK v12 / modular）
 *
 * NEXT_PUBLIC_FIREBASE_* が揃っているときだけ初期化する。
 * 未設定でもアプリはデモモードで動作する（テストユーザーがすぐ触れるように）。
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** 必須3項目が揃っていれば Firebase モードが利用可能 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/** Storage バケットが未設定でもアップロードを試せるよう既定値を補完する */
const resolvedStorageBucket =
  firebaseConfig.storageBucket || (firebaseConfig.projectId ? `${firebaseConfig.projectId}.firebasestorage.app` : "");

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase が未設定です。.env.local に NEXT_PUBLIC_FIREBASE_* を設定してください。");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp({ ...firebaseConfig, storageBucket: resolvedStorageBucket });
  }
  return app;
}

export function getFbAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFbStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

/** Firestore コレクション名 */
export const COLLECTIONS = {
  users: "users",
  shrines: "shrines",
  visits: "visits",
  goshuin: "goshuin",
  favorites: "favorites",
  /** v1.0 の旧コレクション（移行元。新規書き込みはしない） */
  legacyVisitHistory: "visit_history",
} as const;

/** Storage の保存パス */
export const STORAGE_PATHS = {
  goshuin: (uid: string, fileName: string) => `goshuin/${uid}/${fileName}`,
  avatar: (uid: string, fileName: string) => `avatars/${uid}/${fileName}`,
} as const;

/** Storage の https URL からオブジェクトパスを取り出す（削除用） */
export function storagePathFromUrl(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/o\/(.+?)\?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
