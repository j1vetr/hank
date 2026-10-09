import assert from "node:assert/strict";
import test from "node:test";
import { isBulkSkuCheck, runBulkSkuRepair, type BulkSkuSelection } from "../client/src/lib/bulkSkuRepair";

const selections = (): BulkSkuSelection[] => ["first", "second", "third"].map((productId, index) => ({
  productId, expectedProductSku: `${203 + index}`,
  variants: [{ id: `${productId}-variant`, expectedCurrentSku: "OLD-M", expectedSuggestedSku: `${203 + index}-M` }],
}));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("malformed preview data is rejected before it can render or create repair selections", () => {
  for (const invalid of [null, {}, { products: [] }, { checkedProducts: -1 }]) {
    assert.equal(isBulkSkuCheck(invalid), false);
  }
  const valid = {
    checkedProducts: 1, totalVariants: 1, candidateCount: 1, currentCount: 0,
    customCount: 0, missingSkuProducts: 0,
    products: [{
      product: { id: "p", name: "Test", sku: "203" },
      variants: [{ id: "v", size: "M", color: null, currentSku: "OLD-M",
        suggestedSku: "203-M", status: "candidate", needsUpdate: true }],
    }],
  };
  assert.equal(isBulkSkuCheck(valid), true);
  assert.equal(isBulkSkuCheck({ ...valid, products: [{ product: valid.products[0].product, variants: [null] }] }), false);
});

test("bulk repairs send approved snapshots strictly one product at a time", async () => {
  const calls: string[] = [];
  let active = 0;
  let maximum = 0;
  const snapshots: unknown[] = [];
  const request = (async (url, init) => {
    active++;
    maximum = Math.max(maximum, active);
    calls.push(String(url));
    assert.equal(init?.credentials, "include");
    assert.equal(init?.method, "POST");
    snapshots.push(JSON.parse(String(init?.body)));
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return json({ updatedCount: 1 });
  }) as typeof fetch;
  const results = await runBulkSkuRepair(selections(), { request });
  assert.equal(maximum, 1);
  assert.deepEqual(calls, selections().map(row => `/api/admin/products/${row.productId}/repair-skus`));
  assert.deepEqual(snapshots, selections().map(({ expectedProductSku, variants }) => ({ expectedProductSku, variants })));
  assert.ok(results.every(row => row.status === "updated" && row.updatedCount === 1));
});

test("a product collision or stale-preview error does not prevent other products from updating", async () => {
  let calls = 0;
  const results = await runBulkSkuRepair(selections(), {
    request: (async () => ++calls === 2 ? json({ error: "Kod çakışıyor." }, 409) : json({ updatedCount: 1 })) as typeof fetch,
  });
  assert.equal(calls, 3);
  assert.deepEqual(results.map(row => row.status), ["updated", "failed", "updated"]);
  assert.equal(results[1].message, "Kod çakışıyor.");
  assert.equal(results.reduce((sum, row) => sum + row.updatedCount, 0), 2);
});

test("stop finishes the active request and skips all remaining products", async () => {
  const controller = new AbortController();
  let calls = 0;
  const results = await runBulkSkuRepair(selections(), {
    signal: controller.signal,
    request: (async (_url, init) => {
      calls++;
      assert.equal(init?.signal, undefined, "the database mutation must not be interrupted");
      controller.abort();
      return json({ updatedCount: 1 });
    }) as typeof fetch,
  });
  assert.equal(calls, 1);
  assert.deepEqual(results.map(row => row.status), ["updated", "skipped", "skipped"]);
});

test("authentication failure stops subsequent mutations", async () => {
  for (const status of [401, 403]) {
    let calls = 0;
    const results = await runBulkSkuRepair(selections(), {
      request: (async () => { calls++; return json({ error: "Yetki gerekli." }, status); }) as typeof fetch,
    });
    assert.equal(calls, 1);
    assert.deepEqual(results.map(row => row.status), ["failed", "skipped", "skipped"]);
  }
});

test("a lost or malformed successful response is uncertain, never silently successful or retried", async () => {
  for (const reply of [
    async () => { throw new Error("connection lost after commit"); },
    async () => json({}),
    async () => new Response("not-json"),
    async () => json({ updatedCount: 0 }),
    async () => json({ error: "Server failure" }, 500),
  ]) {
    let calls = 0;
    const results = await runBulkSkuRepair(selections(), {
      request: (async () => { calls++; return reply(); }) as typeof fetch,
    });
    assert.equal(calls, 1);
    assert.deepEqual(results.map(row => row.status), ["uncertain", "skipped", "skipped"]);
    assert.equal(results.reduce((sum, row) => sum + row.updatedCount, 0), 0);
  }
});

test("callbacks report progress in order and empty/already-stopped runs make no requests", async () => {
  const events: string[] = [];
  const results = await runBulkSkuRepair(selections(), {
    onStart: (id, index, total) => events.push(`start:${id}:${index}:${total}`),
    onResult: result => events.push(`result:${result.productId}:${result.status}`),
    request: (async () => json({ updatedCount: 1 })) as typeof fetch,
  });
  assert.equal(results.length, 3);
  assert.deepEqual(events.slice(0, 4), [
    "start:first:0:3", "result:first:updated", "start:second:1:3", "result:second:updated",
  ]);
  const controller = new AbortController();
  controller.abort();
  const failRequest = (async () => { throw new Error("must not be called"); }) as typeof fetch;
  assert.deepEqual(await runBulkSkuRepair([], { request: failRequest }), []);
  const stopped = await runBulkSkuRepair(selections(), { request: failRequest, signal: controller.signal });
  assert.ok(stopped.every(row => row.status === "skipped"));
});
