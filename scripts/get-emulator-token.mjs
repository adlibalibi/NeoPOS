// Creates (or signs in) an emulator user and prints its ID token.
// Requires AUTH emulator running and FIREBASE_AUTH_EMULATOR_HOST set.

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const apiKey = process.env.NEOPOS_EMULATOR_API_KEY || "fake-api-key";
const projectId = process.env.GCLOUD_PROJECT || "demo-neopos";
const email = process.env.NEOPOS_TEST_EMAIL || "benchmark-admin@example.com";
const password = process.env.NEOPOS_TEST_PASSWORD || "benchmark-password";

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("FIREBASE_AUTH_EMULATOR_HOST is not set. Start Auth emulator first.");
  process.exit(1);
}

const app = initializeApp({
  apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
});

const auth = getAuth(app);

async function main() {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  const token = await auth.currentUser.getIdToken();
  process.stdout.write(token);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

