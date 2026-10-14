
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "node:path";
import { readFileSync } from "node:fs";

const serviceAccountPath = path.resolve(process.cwd(), "credentials/firebase-service-account.json");

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

const firebaseApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount), });

export const firebaseMessaging = getMessaging(firebaseApp);
