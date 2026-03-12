// Generates synthetic sales against the backend /payment/record-sale endpoint.
// Requires backend running and inventory seeded in emulator.

const API_BASE = process.env.NEOPOS_API_BASE || "http://localhost:5050";
const TOKEN = process.env.NEOPOS_BEARER_TOKEN;
const UID = process.env.NEOPOS_TEST_UID || "benchmark-admin";
const SALES = Number(process.env.NEOPOS_SALES || 5000);
const CART_MIN = Number(process.env.NEOPOS_CART_MIN || 1);
const CART_MAX = Number(process.env.NEOPOS_CART_MAX || 5);

if (!TOKEN) {
  console.error("NEOPOS_BEARER_TOKEN is required.");
  process.exit(1);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickItemId() {
  const idx = randInt(0, 999);
  return `item-${String(idx).padStart(4, "0")}`;
}

async function main() {
  console.log(`Running ${SALES} synthetic sales -> ${API_BASE}/payment/record-sale`);
  let ok = 0;
  let fail = 0;
  let insufficient = 0;

  const t0 = Date.now();
  for (let i = 0; i < SALES; i++) {
    const cartSize = randInt(CART_MIN, CART_MAX);
    const itemsMap = new Map();
    for (let j = 0; j < cartSize; j++) {
      const id = pickItemId();
      itemsMap.set(id, (itemsMap.get(id) || 0) + randInt(1, 3));
    }
    const items = Array.from(itemsMap.entries()).map(([item_id, quantity]) => ({ item_id, quantity }));

    const res = await fetch(`${API_BASE}/payment/record-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "X-Emulator-Uid": UID,
      },
      body: JSON.stringify({
        // user_id is ignored by backend now, but we keep it to be explicit.
        user_id: UID,
        payment_method: "cash",
        items,
      }),
    });

    if (res.ok) {
      ok++;
    } else {
      fail++;
      try {
        const data = await res.json();
        if ((data?.error || "").toLowerCase().includes("insufficient stock")) insufficient++;
      } catch {}
    }

    if ((i + 1) % 500 === 0) console.log(`Progress: ${i + 1}/${SALES} (ok=${ok}, fail=${fail})`);
  }

  const elapsed = (Date.now() - t0) / 1000;
  console.log(JSON.stringify({ ok, fail, insufficient, elapsed_s: elapsed, rps: ok / elapsed }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

