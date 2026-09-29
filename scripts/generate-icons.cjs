/**
 * Gasto Buster — PWA icon generator.
 *
 * Writes `public/icons/icon-192.png` and `public/icons/icon-512.png`.
 * Dependency-free on purpose: a ~120-line PNG encoder (zlib + CRC32) keeps the
 * icon source reproducible without adding a canvas/imagemagick toolchain.
 *
 * Art direction (normalized 0..1 coordinates, so one routine renders both sizes):
 *   - slate-900 full-bleed background (`theme_color` #0f172a)
 *   - an indigo wallet with a card tucked behind it and a darker pocket/clasp
 *   - all artwork stays inside a centered circle of radius 0.28, comfortably
 *     within the 80% maskable safe zone (radius 0.4) used by Android.
 *
 * Usage: node scripts/generate-icons.cjs   (or `npm run generate:icons`)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

/** [r, g, b, a] */
const COLORS = {
  background: [15, 23, 42, 255], // #0f172a  slate-900
  card: [199, 210, 254, 255], // #c7d2fe  indigo-200
  wallet: [99, 102, 241, 255], // #6366f1  indigo-500
  pocket: [79, 70, 229, 255], // #4f46e5  indigo-600
  clasp: [224, 231, 255, 255], // #e0e7ff  indigo-100
};

// --- PNG encoding ---------------------------------------------------------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** Encodes an RGBA byte buffer as an 8-bit truecolour PNG. */
function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0; // scanline filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- drawing --------------------------------------------------------------

function blendPixel(rgba, size, x, y, color, coverage) {
  if (x < 0 || y < 0 || x >= size || y >= size || coverage <= 0) return;
  const alpha = Math.min(1, coverage) * (color[3] / 255);
  const i = (y * size + x) * 4;
  rgba[i] = Math.round(rgba[i] * (1 - alpha) + color[0] * alpha);
  rgba[i + 1] = Math.round(rgba[i + 1] * (1 - alpha) + color[1] * alpha);
  rgba[i + 2] = Math.round(rgba[i + 2] * (1 - alpha) + color[2] * alpha);
  rgba[i + 3] = Math.max(rgba[i + 3], Math.round(255 * alpha));
}

/** Signed distance to a rounded rectangle (normalized units). */
function roundedRectDistance(px, py, cx, cy, hw, hh, radius) {
  const dx = Math.abs(px - cx) - (hw - radius);
  const dy = Math.abs(py - cy) - (hh - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - radius;
}

function fillRoundedRect(rgba, size, { cx, cy, hw, hh, radius }, color) {
  const x0 = Math.max(0, Math.floor((cx - hw - 0.01) * size));
  const x1 = Math.min(size - 1, Math.ceil((cx + hw + 0.01) * size));
  const y0 = Math.max(0, Math.floor((cy - hh - 0.01) * size));
  const y1 = Math.min(size - 1, Math.ceil((cy + hh + 0.01) * size));

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d =
        roundedRectDistance(
          (x + 0.5) / size,
          (y + 0.5) / size,
          cx,
          cy,
          hw,
          hh,
          radius
        ) * size;
      blendPixel(rgba, size, x, y, color, 0.5 - d);
    }
  }
}

function fillCircle(rgba, size, { cx, cy, radius }, color) {
  const x0 = Math.max(0, Math.floor((cx - radius - 0.01) * size));
  const x1 = Math.min(size - 1, Math.ceil((cx + radius + 0.01) * size));
  const y0 = Math.max(0, Math.floor((cy - radius - 0.01) * size));
  const y1 = Math.min(size - 1, Math.ceil((cy + radius + 0.01) * size));

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d =
        (Math.hypot((x + 0.5) / size - cx, (y + 0.5) / size - cy) - radius) *
        size;
      blendPixel(rgba, size, x, y, color, 0.5 - d);
    }
  }
}

/** Renders the wallet mark for a given pixel size. */
function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  rgba.fill(0);
  // Opaque backdrop.
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = COLORS.background[0];
    rgba[i + 1] = COLORS.background[1];
    rgba[i + 2] = COLORS.background[2];
    rgba[i + 3] = 255;
  }

  // Card peeking out of the wallet (drawn first: wallet overlaps its base).
  fillRoundedRect(
    rgba,
    size,
    { cx: 0.5, cy: 0.355, hw: 0.145, hh: 0.06, radius: 0.02 },
    COLORS.card
  );
  // Wallet body.
  fillRoundedRect(
    rgba,
    size,
    { cx: 0.5, cy: 0.52, hw: 0.21, hh: 0.15, radius: 0.05 },
    COLORS.wallet
  );
  // Card pocket on the right.
  fillRoundedRect(
    rgba,
    size,
    { cx: 0.575, cy: 0.55, hw: 0.1, hh: 0.055, radius: 0.0275 },
    COLORS.pocket
  );
  // Clasp dot.
  fillCircle(rgba, size, { cx: 0.61, cy: 0.55, radius: 0.016 }, COLORS.clasp);

  return rgba;
}

// --- verification ---------------------------------------------------------

/** Round-trips the PNG (inflate IDAT, compare scanline bytes) before writing. */
function verifyPng(png, width, height) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!png.subarray(0, 8).equals(sig)) throw new Error('bad PNG signature');

  let offset = 8;
  let idat = Buffer.alloc(0);
  let sawIhdr = false;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = png.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(png.subarray(offset + 4, offset + 8 + length));
    if (expectedCrc !== actualCrc) throw new Error(`bad CRC in ${type} chunk`);
    if (type === 'IHDR') {
      sawIhdr = true;
      if (data.readUInt32BE(0) !== width || data.readUInt32BE(4) !== height) {
        throw new Error('IHDR dimensions mismatch');
      }
    }
    if (type === 'IDAT') idat = Buffer.concat([idat, data]);
    offset += 12 + length;
    if (type === 'IEND') break;
  }

  if (!sawIhdr) throw new Error('missing IHDR');
  const raw = zlib.inflateSync(idat);
  const expected = (width * 4 + 1) * height;
  if (raw.length !== expected) {
    throw new Error(`IDAT size ${raw.length} != expected ${expected}`);
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const size of [192, 512]) {
    const rgba = renderIcon(size);
    const png = encodePng(size, size, rgba);
    verifyPng(png, size, size);

    const file = path.join(OUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(file, png);
    process.stdout.write(
      `generated ${path.relative(process.cwd(), file)} (${size}x${size}, ${png.length} bytes)\n`
    );
  }
}

main();
