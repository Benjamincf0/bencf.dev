import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { zstdCompressSync, zstdDecompressSync } from "node:zlib";

const MAGIC = 0x5053474e;
const SH_COMPONENTS = [0, 9, 24, 45, 72];
export const DEFAULT_FRACTIONS = [0.02, 0.04, 0.08, 0.16, 0.28, 0.42];

// Keep the packed attribute bytes intact: decoding and re-encoding floats would
// introduce another round of quantization. Only the ZSTD streams are repacked.
export function decodeSPZ(bytes) {
  if (bytes.length < 32 || bytes.readUInt32LE(0) !== MAGIC || bytes.readUInt32LE(4) !== 4) {
    throw new Error("Expected an SPZ v4 file. Re-export legacy SPZ/PLY files as SPZ v4 first.");
  }
  const count = bytes.readUInt32LE(8);
  const degree = bytes[12];
  const flags = bytes[14];
  const streamCount = bytes[15];
  const tocOffset = bytes.readUInt32LE(16);
  if (!count || degree >= SH_COMPONENTS.length) throw new Error("Invalid point count or SH degree.");
  if ((flags & ~1) !== 0 || tocOffset !== 32 || bytes.subarray(20, 32).some(byte => byte !== 0)) {
    throw new Error("Extended SPZ headers/LOD are unsupported; export a plain SPZ v4 file first.");
  }
  const strides = [9, 1, 3, 3, 4, SH_COMPONENTS[degree]].filter(Boolean);
  if (streamCount !== strides.length || bytes.length < tocOffset + streamCount * 16) {
    throw new Error("Invalid SPZ stream table.");
  }
  let offset = tocOffset + streamCount * 16;
  const streams = strides.map((stride, i) => {
    const size = Number(bytes.readBigUInt64LE(tocOffset + i * 16));
    const rawSize = bytes.readBigUInt64LE(tocOffset + i * 16 + 8);
    if (!Number.isSafeInteger(size) || size <= 0 || offset + size > bytes.length || rawSize !== BigInt(count * stride)) {
      throw new Error(`Invalid SPZ attribute stream ${i}.`);
    }
    const data = zstdDecompressSync(bytes.subarray(offset, offset + size));
    offset += size;
    if (data.length !== count * stride) throw new Error(`Invalid decompressed stream ${i}.`);
    return data;
  });
  if (offset !== bytes.length) throw new Error("Unexpected trailing SPZ data.");
  return { header: Buffer.from(bytes.subarray(0, 32)), count, strides, streams };
}

function coordinate(positions, index, axis) {
  return positions.readIntLE(index * 9 + axis * 3, 3);
}

function spreadBits(value) {
  let bits = value & 1023;
  bits = (bits | (bits << 16)) & 0x030000ff;
  bits = (bits | (bits << 8)) & 0x0300f00f;
  bits = (bits | (bits << 4)) & 0x030c30c3;
  return (bits | (bits << 2)) & 0x09249249;
}

export function progressiveOrder(positions, count) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      const value = coordinate(positions, i, axis);
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }
  // Morton order puts nearby 3D points near one another in a linear ordering.
  const codes = new Uint32Array(count);
  const spatialOrder = Uint32Array.from({ length: count }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    let code = 0;
    for (let axis = 0; axis < 3; axis++) {
      const cell = Math.floor((coordinate(positions, i, axis) - min[axis]) / (max[axis] - min[axis] || 1) * 1023);
      code |= spreadBits(cell) << axis;
    }
    codes[i] = code;
  }
  spatialOrder.sort((a, b) => codes[a] - codes[b] || a - b);

  // Bit reversal visits widely separated ranks first, then fills their gaps.
  // Every batch is disjoint and the full sequence includes every original splat.
  const bits = Math.ceil(Math.log2(count));
  const order = new Uint32Array(count);
  let cursor = 0;
  for (let i = 0; i < 2 ** bits; i++) {
    let rank = 0;
    let value = i;
    for (let bit = 0; bit < bits; bit++) {
      rank = rank * 2 + value % 2;
      value = Math.floor(value / 2);
    }
    if (rank < count) order[cursor++] = spatialOrder[rank];
  }
  return order;
}

export function chunkSizes(count, fractions) {
  if (!fractions.length || fractions.some(value => !Number.isFinite(value) || value <= 0) ||
      Math.abs(fractions.reduce((sum, value) => sum + value, 0) - 1) > 1e-9) {
    throw new Error("Fractions must be positive numbers adding up to 1.");
  }
  let cumulativeFraction = 0;
  let allocated = 0;
  return fractions.map((fraction, i) => {
    cumulativeFraction += fraction;
    const end = i === fractions.length - 1 ? count : Math.round(count * cumulativeFraction);
    const size = end - allocated;
    allocated = end;
    if (size <= 0) throw new Error("Too few splats for these fractions; use fewer/larger batches.");
    return size;
  });
}

export function encodeChunk(model, indices) {
  // Restore source order within a batch to retain compression locality.
  const sorted = Uint32Array.from(indices).sort();
  const compressed = model.streams.map((stream, s) => {
    const stride = model.strides[s];
    const data = Buffer.alloc(sorted.length * stride);
    for (let i = 0; i < sorted.length; i++) {
      stream.copy(data, i * stride, sorted[i] * stride, (sorted[i] + 1) * stride);
    }
    return zstdCompressSync(data);
  });
  const header = Buffer.from(model.header);
  header.writeUInt32LE(sorted.length, 8);
  const table = Buffer.alloc(compressed.length * 16);
  for (let i = 0; i < compressed.length; i++) {
    table.writeBigUInt64LE(BigInt(compressed[i].length), i * 16);
    table.writeBigUInt64LE(BigInt(sorted.length * model.strides[i]), i * 16 + 8);
  }
  return Buffer.concat([header, table, ...compressed]);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string" },
      fractions: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help || positionals.length !== 1) {
    console.log("Usage: bun run split:splat <input.spz> [--out <directory>] [--fractions 0.02,0.04,0.08,0.16,0.28,0.42]");
    if (!values.help) process.exitCode = 1;
    return;
  }
  const input = resolve(positionals[0]);
  const output = resolve(values.out ?? join(dirname(input), "splats", basename(input, ".spz")));
  const fractions = values.fractions ? values.fractions.split(",").map(Number) : DEFAULT_FRACTIONS;
  const bytes = await readFile(input);
  const model = decodeSPZ(bytes);
  const sizes = chunkSizes(model.count, fractions);
  // Refuse to overwrite files: choose a new directory when regenerating assets.
  await mkdir(output, { recursive: true });
  if ((await readdir(output)).length) throw new Error(`Output directory must be empty: ${output}`);
  const order = progressiveOrder(model.streams[0], model.count);
  const chunks = [];
  let offset = 0;
  for (let i = 0; i < sizes.length; i++) {
    const data = encodeChunk(model, order.subarray(offset, offset + sizes[i]));
    const url = `chunk-${String(i).padStart(2, "0")}.spz`;
    await writeFile(join(output, url), data, { flag: "wx" });
    offset += sizes[i];
    chunks.push({ url, points: sizes[i], bytes: data.length, cumulativePoints: offset });
    console.log(`${url}: ${sizes[i].toLocaleString()} splats, ${(data.length / 1024).toFixed(1)} KiB`);
  }
  const manifest = {
    version: 1,
    source: basename(input),
    sourceBytes: bytes.length,
    totalPoints: model.count,
    shDegree: model.header[12],
    fractions,
    chunks,
  };
  await writeFile(join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
  const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
  console.log(`Total: ${(totalBytes / 1048576).toFixed(2)} MiB (${((totalBytes / bytes.length - 1) * 100).toFixed(1)}% vs source). Manifest: ${join(output, "manifest.json")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
