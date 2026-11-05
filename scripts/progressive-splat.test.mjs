import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { PerspectiveCamera } from "three/webgpu";
import { createGaussianSplatGeometry } from "three/addons/utils/GaussianSplatUtils.js";
import { GaussianSplat } from "../src/GaussianSplat.js";
import { loadSplatChunks } from "../src/loadSplatChunks.js";

function batch(depths) {
  const centers = Float32Array.from(depths.flatMap(z => [0, 0, z]));
  const covariance = Float32Array.from(depths.flatMap(() => [0.01, 0, 0, 0.01, 0, 0.01]));
  const colors = Uint8ClampedArray.from(depths.flatMap(() => [100, 150, 200, 255]));
  const sh1 = Uint32Array.from(depths.flatMap(z => [0x80808080 + Math.abs(z), 0x80808080, 0x80808080]));
  return createGaussianSplatGeometry(centers, covariance, colors, { sh1 });
}

test("incoming batches share a material and buffers, and sort globally at the current camera pose", () => {
  const first = batch([-3, -1]);
  const mesh = new GaussianSplat(first, { capacity: 4, revealDuration: 0.35 });
  const material = mesh.material;
  const buffers = mesh._buffers;
  const centers = buffers.centerRead.value.array;
  const camera = new PerspectiveCamera(30, 1, 0.01, 100);
  camera.updateMatrixWorld();
  const renderer = { backend: { isWebGLBackend: true } };
  mesh.updateSort(renderer, camera);
  assert.deepEqual(Array.from(mesh._sort.orderAttribute.array.subarray(0, 2)), [0, 1]);
  assert.equal(mesh.updateSort(renderer, camera), false);

  // Simulate the storage texture padding/reallocation performed by WebGL.
  const sh = buffers.sphericalHarmonics1Attribute;
  sh.array = new Uint32Array(sh.array);
  sh.pbo = {};
  const incoming = batch([-4, -2]);
  mesh.revealTime.value = 2;
  mesh.appendGeometry(incoming);
  assert.equal(mesh.material, material);
  assert.equal(mesh._buffers, buffers);
  assert.equal(buffers.centerRead.value.array, centers);
  assert.equal(mesh.geometry.instanceCount, 4);
  assert.equal(mesh._sphericalHarmonicsComputeNode.count, 4);
  assert.equal(centers[3], 0);
  assert.equal(centers[11], 2);
  assert.equal(centers[15], 2);
  assert.deepEqual(sh.array.subarray(6), incoming.getAttribute("sphericalHarmonics1").array);
  assert.equal(sh.pbo.needsUpdate, true);
  assert.equal(mesh.updateSort(renderer, camera), true, "A stationary camera must still re-sort new splats.");
  assert.deepEqual(Array.from(mesh._sort.orderAttribute.array), [2, 0, 3, 1]);
  mesh.computeBoundingBox();
  assert.ok(mesh.boundingBox.min.z < -4);
  assert.ok(mesh.boundingBox.max.z < 0, "Unused reserved entries must not affect bounds.");
  assert.throws(() => mesh.appendGeometry(incoming), /capacity/);
  mesh.dispose();
  first.dispose();
  incoming.dispose();
});

test("incompatible batches are rejected before modifying existing splats", () => {
  const first = batch([-3]);
  const mesh = new GaussianSplat(first, { capacity: 2 });
  const incoming = batch([-2]);
  incoming.deleteAttribute("sphericalHarmonics1");
  assert.throws(() => mesh.appendGeometry(incoming), /matching attributes/);
  assert.equal(mesh.count, 1);
  assert.equal(mesh.geometry.instanceCount, 1);
  mesh.dispose();
  first.dispose();
  incoming.dispose();
});

test("bursty and delayed arrivals stagger new splats without restarting the existing reveal", () => {
  const first = batch(Array.from({ length: 256 }, (_, i) => -1 - i / 256));
  const mesh = new GaussianSplat(first, { capacity: 1024, revealDuration: 1.1, revealStagger: 4 });
  const times = () => Array.from({ length: mesh.count }, (_, i) => mesh._buffers.centerRead.value.array[i * 4 + 3]);
  const initialTimes = times();
  const bins = new Set(initialTimes.map(time => Math.floor(time * 8)));
  assert.equal(bins.size, 8, "The first sample should fade in across the entire stagger window.");
  assert.ok(initialTimes.every(time => time >= 0 && time < 1));

  mesh.revealTime.value = 0.1;
  mesh.appendGeometry(first);
  assert.deepEqual(times().slice(0, 256), initialTimes);
  assert.ok(times().slice(256).every(time => time >= 1 && time < 2), "Fast arrivals should queue instead of revealing together.");
  mesh.appendGeometry(first);
  assert.ok(times().slice(512).every(time => time >= 2 && time < 3));

  const beforeGap = times();
  mesh.revealTime.value = 9;
  mesh.appendGeometry(first);
  assert.deepEqual(times().slice(0, 768), beforeGap);
  assert.ok(times().slice(768).every(time => time >= 9 && time < 10), "Late data should begin a fresh fade, not arrive already visible.");
  mesh.dispose();
  first.dispose();
});

test("stalled frames and background tabs cannot skip through the reveal", () => {
  const first = batch([-1]);
  const mesh = new GaussianSplat(first, { revealDuration: 1.1 });
  mesh.advanceReveal(1 / 60);
  assert.equal(mesh.revealTime.value, 1 / 60);
  mesh.advanceReveal(10);
  assert.equal(mesh.revealTime.value, 1 / 60 + 0.05);
  mesh.advanceReveal(-1);
  assert.equal(mesh.revealTime.value, 1 / 60 + 0.05);
  mesh.dispose();
});

test("the loader waits for the consumer before fetching another batch and stops on abort", async () => {
  const bytes = await readFile(new URL("../public/splats/splat_ben2/chunk-00.spz", import.meta.url));
  const requested = [];
  const server = createServer((request, response) => {
    requested.push(request.url);
    if (request.url === "/manifest.json") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ version: 1, totalPoints: 13512, chunks: [
        { url: "first.spz", points: 6756 },
        { url: "second.spz", points: 6756 },
      ] }));
    } else {
      response.end(bytes);
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const controller = new AbortController();
    const loader = loadSplatChunks(new URL(`http://127.0.0.1:${server.address().port}/manifest.json`), controller.signal);
    const first = await loader.next();
    assert.equal(first.value.geometry.getAttribute("position").count, 6756);
    assert.deepEqual(requested, ["/manifest.json", "/first.spz"]);
    first.value.geometry.dispose();
    controller.abort();
    await assert.rejects(loader.next(), error => error.name === "AbortError");
    assert.deepEqual(requested, ["/manifest.json", "/first.spz"]);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
