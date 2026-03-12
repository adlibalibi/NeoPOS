import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const UID = process.env.NEOPOS_TEST_UID || "benchmark-admin";
const ITEM_COUNT = Number(process.env.NEOPOS_ITEM_COUNT || 1000);

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set. Start emulators first.");
  process.exit(1);
}

initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-neopos" });
const db = getFirestore();

async function main() {
  console.log(`Seeding user ${UID} with ${ITEM_COUNT} inventory items...`);

  await db.collection("users").doc(UID).set(
    {
      name: "Benchmark Admin",
      email: "benchmark-admin@example.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const invRef = db.collection("users").doc(UID).collection("inventory");

  const batchSize = 400;
  let batch = db.batch();
  let inBatch = 0;

  for (let i = 0; i < ITEM_COUNT; i++) {
    const docRef = invRef.doc(`item-${String(i).padStart(4, "0")}`);
    const price = randInt(10, 2000); // INR
    const stock = randInt(10, 200);
    batch.set(docRef, {
      name: `Item ${i}`,
      price,
      stock,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inBatch++;

    if (inBatch >= batchSize) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
      if ((i + 1) % 2000 === 0) console.log(`Seeded ${i + 1}/${ITEM_COUNT}`);
    }
  }

  if (inBatch > 0) await batch.commit();

  console.log("Done seeding.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

