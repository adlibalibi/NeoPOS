# NeoPOS engineering benchmark (Firebase Emulator)

This benchmark uses **Firebase Emulator (Auth + Firestore)**, the local Flask backend, and synthetic sales traffic against the **cash sale recording** endpoint.

## Setup

- Firebase emulators: Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8080`
- Backend: `http://localhost:5050`
- Dataset: **1,000 inventory items** seeded under a single test user, then sales traffic with carts of **1–5 items**, quantities **1–3**.

## Correctness results (post-run)

- **Negative-stock items:** 0
- **Zero-stock items:** 77
- **Min stock observed:** 0

Output from `scripts/validate-stock.mjs`:

```json
{
  "totalItems": 1000,
  "negativeStockItems": 0,
  "zeroStockItems": 77,
  "minStock": 0
}
```

## Baseline throughput test (5,000 synthetic sales)

Using `node scripts/run-sales.mjs`:

- **Successful sales:** 4,529 / 5,000 (**90.58%**)
- **Failures:** 471 / 5,000 (**9.42%**) — all were **insufficient stock**
- **Elapsed:** 27.322s
- **Effective successful RPS:** **165.76 req/s**

```json
{
  "ok": 4529,
  "fail": 471,
  "insufficient": 471,
  "elapsed_s": 27.322,
  "rps": 165.76385330502893
}
```

## Load test results (k6)

Scenario: ramp to **50 VUs**, then hold, using `scripts/k6-record-sale.js`.

### Request rate
- **Total requests:** 48,172
- **Throughput:** **481.71 req/s**

### Latency (http_req_duration)
- **median:** 7.94ms
- **p90:** 48.83ms
- **p95:** 67.51ms
- **p99:** 112.82ms
- **max:** 375.55ms

> Note: a portion of requests returned HTTP 400 `Insufficient stock` as the inventory depleted under randomized carts. Those are expected under this dataset and load model.

### Known limitation observed
k6 reported intermittent local connection failures at peak load:
- `dial tcp 127.0.0.1:5050: connect: can't assign requested address`

This is consistent with local ephemeral port exhaustion/connection churn under high concurrency. A production WSGI server configuration and connection reuse tuning would reduce this.

## Observability snapshot (Prometheus)

Backend exposes `/metrics` and counts requests via:
- `http_requests_total{method,endpoint}`

After the runs, `/metrics` included:

- `http_requests_total{endpoint="/payment/record-sale",method="POST"} 89509`

## Resume-ready engineering metrics (from this run)

- Load-tested POS sale recording at **~482 req/s** with **p95 67.5ms** and **p99 112.8ms** latency (local, emulator-backed Firestore).
- Verified correctness invariant: **0 negative-stock events** across **1,000 SKUs** under randomized cart purchases.
- Instrumented API traffic with Prometheus (`http_requests_total` by endpoint/method); observed **~89k POST** requests to `/payment/record-sale` during benchmarking.

