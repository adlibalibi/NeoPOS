import http from "k6/http";
import { check, sleep } from "k6";

const API_BASE = __ENV.NEOPOS_API_BASE || "http://localhost:5050";
const TOKEN = __ENV.NEOPOS_BEARER_TOKEN || "";
const UID = __ENV.NEOPOS_TEST_UID || "";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickItemId() {
  const idx = randInt(0, 999);
  return `item-${String(idx).padStart(4, "0")}`;
}

export const options = {
  scenarios: {
    steady: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 20 },
        { duration: "45s", target: 50 },
        { duration: "30s", target: 50 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
};

export default function () {
  const cartSize = randInt(1, 5);
  const itemsMap = new Map();
  for (let i = 0; i < cartSize; i++) {
    const id = pickItemId();
    itemsMap.set(id, (itemsMap.get(id) || 0) + randInt(1, 3));
  }
  const items = Array.from(itemsMap.entries()).map(([item_id, quantity]) => ({ item_id, quantity }));

  const res = http.post(
    `${API_BASE}/payment/record-sale`,
    JSON.stringify({ payment_method: "cash", items }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "X-Emulator-Uid": UID,
      },
      tags: { name: "record_sale" },
    }
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "status is 400_insufficient_or_200": (r) => r.status === 200 || r.status === 400,
  });

  sleep(0.05);
}

