import { SPZLoader } from "three/addons/loaders/SPZLoader.js";

async function fetchChecked(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  return response;
}

/** Yields decoded, disjoint batches in manifest order. The caller owns each geometry. */
export async function* loadSplatChunks(manifestUrl, signal) {
  const manifest = await (await fetchChecked(manifestUrl, signal)).json();
  if (manifest.version !== 1 || !Number.isSafeInteger(manifest.totalPoints) || manifest.totalPoints <= 0 ||
      !Array.isArray(manifest.chunks) || !manifest.chunks.length ||
      manifest.chunks.some(chunk => typeof chunk.url !== "string" || !chunk.url ||
        !Number.isSafeInteger(chunk.points) || chunk.points <= 0) ||
      manifest.chunks.reduce((sum, chunk) => sum + chunk.points, 0) !== manifest.totalPoints) {
    throw new Error("Invalid progressive splat manifest.");
  }
  const loader = new SPZLoader();
  for (const chunk of manifest.chunks) {
    signal.throwIfAborted();
    const response = await fetchChecked(new URL(chunk.url, manifestUrl), signal);
    const geometry = await loader.parse(await response.arrayBuffer());
    if (signal.aborted || geometry.getAttribute("position").count !== chunk.points) {
      geometry.dispose();
      signal.throwIfAborted();
      throw new Error(`Unexpected point count in ${chunk.url}.`);
    }
    yield { geometry, totalPoints: manifest.totalPoints };
  }
}
