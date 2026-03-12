import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const UID = process.env.NEOPOS_TEST_UID || "benchmark-admin";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set. Start emulators first.");
  process.exit(1);
}

initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-neopos" });
const db = getFirestore();

async function main() {
  const invRef = db.collection("users").doc(UID).collection("inventory");
  const snap = await invRef.get();

  let negative = 0;
  let zero = 0;
  let total = 0;
  let minStock = Infinity;

  snap.forEach((d) => {
    const s = Number(d.data().stock ?? 0);
    total++;
    if (s < 0) negative++;
    if (s === 0) zero++;
    minStock = Math.min(minStock, s);
  });

  const out = { totalItems: total, negativeStockItems: negative, zeroStockItems: zero, minStock };
  console.log(JSON.stringify(out, null, 2));
  if (negative > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

