import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
import { chunkSizes, decodeSPZ, DEFAULT_FRACTIONS, encodeChunk, progressiveOrder } from "./split-spz.mjs";

function fixture(degree = 3) {
  const count = 512;
  const header = Buffer.alloc(32);
  header.writeUInt32LE(0x5053474e, 0);
  header.writeUInt32LE(4, 4);
  header.writeUInt32LE(count, 8);
  header[12] = degree;
  header[13] = 12;
  header[14] = 1;
  const strides = [9, 1, 3, 3, 4, degree ? 45 : 0].filter(Boolean);
  header[15] = strides.length;
  header.writeUInt32LE(32, 16);
  const streams = strides.map((stride, s) => Buffer.from(Uint8Array.from({ length: count * stride }, (_, i) => (i * 13 + s * 7) % 256)));
  for (let i = 0; i < count; i++) {
    streams[0].writeIntLE(i % 8 - 4, i * 9, 3);
    streams[0].writeIntLE(Math.floor(i / 8) % 8 - 4, i * 9 + 3, 3);
    streams[0].writeIntLE(Math.floor(i / 64) - 4, i * 9 + 6, 3);
  }
  return { count, header, strides, streams };
}

test("early samples cover all octants; arbitrary point counts appear exactly once", () => {
  const model = fixture();
  const order = progressiveOrder(model.streams[0], model.count);
  const octants = new Set(Array.from(order.subarray(0, 8), index => {
    const p = model.streams[0];
    return [0, 1, 2].map(axis => Number(p.readIntLE(index * 9 + axis * 3, 3) >= 0)).join("");
  }));
  assert.equal(octants.size, 8);
  for (const count of [1, 7, 337, 512]) {
    const sample = progressiveOrder(model.streams[0], count);
    assert.deepEqual(Array.from(sample).sort((a, b) => a - b), Array.from({ length: count }, (_, i) => i));
    assert.deepEqual(sample, progressiveOrder(model.streams[0], count));
  }
});

test("all batches retain every packed attribute exactly and load with Three.js", async () => {
  for (const degree of [0, 3]) {
    const model = fixture(degree);
    const order = progressiveOrder(model.streams[0], model.count);
    const sizes = chunkSizes(model.count, DEFAULT_FRACTIONS);
    let offset = 0;
    const seen = new Set();
    for (const size of sizes) {
      const indices = order.slice(offset, offset + size).sort();
      const encoded = encodeChunk(model, indices);
      const decoded = decodeSPZ(encoded);
      const geometry = await new SPZLoader().parse(Uint8Array.from(encoded).buffer);
      assert.equal(geometry.getAttribute("position").count, size);
      assert.equal(Boolean(geometry.getAttribute("sphericalHarmonics3")), degree === 3);
      assert.equal(decoded.header[14], 1);
      for (let i = 0; i < size; i++) {
        assert.equal(seen.has(indices[i]), false);
        seen.add(indices[i]);
        model.strides.forEach((stride, s) => {
          assert.deepEqual(decoded.streams[s].subarray(i * stride, (i + 1) * stride),
            model.streams[s].subarray(indices[i] * stride, (indices[i] + 1) * stride));
        });
      }
      geometry.dispose();
      offset += size;
    }
    assert.equal(seen.size, model.count);
  }
});

test("rejects invalid distributions, truncated streams, and unsupported extensions", () => {
  for (const fractions of [[], [0.5], [0, 1], [-1, 2], [NaN, 1], [0.001, 0.999]]) {
    assert.throws(() => chunkSizes(10, fractions));
  }
  const model = fixture();
  const bytes = encodeChunk(model, Uint32Array.from({ length: model.count }, (_, i) => i));
  assert.throws(() => decodeSPZ(bytes.subarray(0, bytes.length - 1)), /stream/);
  const extended = Buffer.from(bytes);
  extended[14] |= 2;
  assert.throws(() => decodeSPZ(extended), /unsupported/);
});

test("CLI produces a consistent manifest and refuses to overwrite existing output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "split-spz-test-"));
  try {
    const model = fixture();
    const input = join(directory, "portrait.spz");
    await writeFile(input, encodeChunk(model, Uint32Array.from({ length: model.count }, (_, i) => i)));
    const run = () => spawnSync(process.execPath, ["scripts/split-spz.mjs", input], { encoding: "utf8" });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const output = join(directory, "splats", "portrait");
    const manifest = JSON.parse(await readFile(join(output, "manifest.json"), "utf8"));
    assert.equal(manifest.totalPoints, model.count);
    let total = 0;
    for (const chunk of manifest.chunks) {
      const data = await readFile(join(output, chunk.url));
      assert.equal(data.length, chunk.bytes);
      assert.equal(decodeSPZ(data).count, chunk.points);
      total += chunk.points;
      assert.equal(chunk.cumulativePoints, total);
    }
    assert.equal(total, model.count);
    assert.match(run().stderr, /must be empty/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
