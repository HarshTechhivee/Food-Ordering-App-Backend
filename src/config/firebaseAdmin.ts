
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { ServiceAccount } from "firebase-admin";
import path from "node:path";
import { readFileSync } from "node:fs";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let serviceAccount: ServiceAccount;

if (serviceAccountJson) {

    serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

} else if (process.env.NODE_ENV === "production") {

    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required in production");

} else {

    const serviceAccountPath = path.resolve(process.cwd(), "credentials/firebase-service-account.json");

    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;
}

const firebaseApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount), });

export const firebaseMessaging = getMessaging(firebaseApp);
