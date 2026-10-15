import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { refs } from '../shared/visual-system.js';

export async function buildReferenceSheet(directory) {
  const originals = await Promise.all(refs.map(async ([, file]) => readFile(join(directory, file))));
  // Composite in memory only; never resize or overwrite the source files.
  const tile = 256;
  const columns = 5;
  const rows = Math.ceil(refs.length / columns);
  const layers = await Promise.all(originals.map(async (buffer, index) => ({
    input: await sharp(buffer).resize(tile, tile, { fit: 'contain', background: '#ffffff' }).png().toBuffer(),
    left: (index % columns) * tile,
    top: Math.floor(index / columns) * tile,
  })));
  const buffer = await sharp({ create: { width: columns * tile, height: rows * tile, channels: 3, background: '#ffffff' } }).composite(layers).png().toBuffer();
  return { buffer, hashes: originals.map(hashImage), count: originals.length };
}
export const hashImage = buffer => createHash('sha256').update(buffer).digest('hex');
